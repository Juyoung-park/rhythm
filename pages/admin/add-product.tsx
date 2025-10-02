"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { db } from "../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { handleLogout } from "../../lib/auth"

export default function AddProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    active: true,
    sizes: [] as string[],
    colors: [] as string[],
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")

  // Firebase 연결 상태 확인
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        console.log("=== Firebase 연결 상태 확인 시작 ===")
        console.log("Firestore 객체:", db)
        
        // Firestore 연결 테스트
        const testCollection = collection(db, "products")
        console.log("Firestore 컬렉션 참조 생성 성공:", testCollection.id)
        
        setFirebaseConnected(true)
        console.log("=== Firebase 연결 성공 ===")
      } catch (error) {
        console.error("=== Firebase 연결 실패 ===")
        console.error("에러:", error)
        console.error("에러 메시지:", error instanceof Error ? error.message : String(error))
        setFirebaseConnected(false)
      }
    }
    
    checkFirebaseConnection()
  }, [])

  // 개별 필드 핸들러로 분리
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, name: e.target.value }))
  }, [])

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, price: e.target.value }))
  }, [])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, description: e.target.value }))
  }, [])

  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, imageUrl: e.target.value }))
  }, [])

  // 사이즈 관리 함수들
  const addSize = useCallback(() => {
    if (newSize.trim() && !form.sizes.includes(newSize.trim())) {
      setForm(prev => ({ ...prev, sizes: [...prev.sizes, newSize.trim()] }))
      setNewSize("")
    }
  }, [newSize, form.sizes])

  const removeSize = useCallback((sizeToRemove: string) => {
    setForm(prev => ({ ...prev, sizes: prev.sizes.filter(size => size !== sizeToRemove) }))
  }, [])

  // 색상 관리 함수들
  const addColor = useCallback(() => {
    if (newColor.trim() && !form.colors.includes(newColor.trim())) {
      setForm(prev => ({ ...prev, colors: [...prev.colors, newColor.trim()] }))
      setNewColor("")
    }
  }, [newColor, form.colors])

  const removeColor = useCallback((colorToRemove: string) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter(color => color !== colorToRemove) }))
  }, [])

  // 이미지 압축 함수
  const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // 이미지 크기 계산
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)
        
        // 압축된 이미지를 Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              console.log(`이미지 압축 완료: ${file.size} → ${compressedFile.size} bytes`)
              resolve(compressedFile)
            } else {
              console.log("압축 실패, 원본 파일 사용")
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }, [])


  // 이미지를 Base64로 변환하는 함수
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        console.log("Base64 변환 완료, 크기:", result.length, "characters")
        resolve(result)
      }
      reader.onerror = () => reject(new Error("파일 읽기 실패"))
      reader.readAsDataURL(file)
    })
  }, [])

  // 이미지를 Base64로 변환하는 함수 (재시도 포함)
  async function convertImageWithRetry(file: File, maxRetries: number = 3): Promise<string> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`이미지 변환 시도 ${attempt}/${maxRetries}`)
        setRetryCount(attempt - 1)
        
        if (attempt > 1) {
          setUploadStatus(`재시도 중... (${attempt}/${maxRetries})`)
          setUploadProgress(0)
          // 재시도 전 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        return await convertImage(file)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`변환 시도 ${attempt} 실패:`, lastError.message)
        
        if (attempt === maxRetries) {
          throw lastError
        }
      }
    }
    
    throw lastError || new Error("변환 실패")
  }

  async function convertImage(file: File): Promise<string> {
    console.log("=== 이미지 압축 및 Base64 변환 시작 ===")
    console.log("원본 파일명:", file.name)
    console.log("원본 파일 크기:", file.size, "bytes")
    console.log("파일 타입:", file.type)
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("이미지 파일이 너무 큽니다 (최대 10MB)")
    }
    
    try {
      setUploadStatus("이미지 압축 중...")
      setUploadProgress(20)
      
      // 이미지 압축 (800px 최대, 70% 품질)
      console.log("이미지 압축 시작...")
      const compressedFile = await compressImage(file, 800, 0.7)
      setUploadProgress(60)
      
      setUploadStatus("Base64 변환 중...")
      console.log("Base64 변환 시작...")
      const base64String = await convertToBase64(compressedFile)
      setUploadProgress(100)
      
      console.log("Base64 변환 완료, 크기:", base64String.length, "characters")
      console.log("=== 이미지 변환 성공 ===")
      return base64String
    } catch (error) {
      console.error("=== 이미지 변환 에러 ===")
      console.error("에러 타입:", typeof error)
      console.error("에러 객체:", error)
      console.error("에러 메시지:", error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setUploadStatus("업로드 준비 중...")
    
    // 전체 프로세스 타임아웃 (5분으로 연장)
    const overallTimeout = setTimeout(() => {
      setUploading(false)
      setUploadStatus("업로드 시간 초과 - 네트워크를 확인해주세요")
      alert("업로드가 시간 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.")
    }, 300000)
    
    try {
      // 폼 검증
      if (!form.name.trim()) {
        throw new Error("제품명을 입력해주세요")
      }
      if (!form.price.trim() || isNaN(Number(form.price))) {
        throw new Error("올바른 가격을 입력해주세요")
      }
      // 이미지 검증을 선택사항으로 변경 (임시 해결책)
      // if (!imageFile && !form.imageUrl.trim()) {
      //   throw new Error("제품 이미지를 추가해주세요 (카메라/갤러리 또는 URL)")
      // }

      console.log("업로드 시작...")
      setUploadStatus("데이터 검증 완료")
      
      let imageUrl = form.imageUrl
      
      // 이미지 파일이 있으면 업로드
      if (imageFile) {
        console.log("이미지 변환 시도...", imageFile.name)
        setUploadStatus(`이미지 변환 시도 중... (${imageFile.name})`)
        
        try {
          imageUrl = await convertImageWithRetry(imageFile)
          console.log("이미지 변환 완료:", imageUrl.substring(0, 50) + "...")
          setUploadStatus("이미지 변환 완료")
        } catch (conversionError) {
          console.error("이미지 변환 실패:", conversionError)
          const errorMessage = conversionError instanceof Error ? conversionError.message : String(conversionError)
          
          setUploadStatus(`이미지 변환 실패: ${errorMessage}`)
          alert(`이미지 변환에 실패했습니다: ${errorMessage}\n\n임시로 이미지 없이 제품만 등록합니다.`)
          
          // 이미지 변환 실패해도 제품 등록은 계속 진행
          imageUrl = ""
        }
      }

      console.log("Firestore에 제품 데이터 저장 중...")
      setUploadStatus("제품 정보 저장 중...")
      
      const productData = {
        ...form,
        price: Number(form.price),
        imageUrl,
        createdAt: serverTimestamp(),
      }
      console.log("저장할 데이터:", productData)
      console.log("사이즈 배열:", form.sizes)
      console.log("색상 배열:", form.colors)

      // Firestore 저장에도 타임아웃 추가 (30초로 연장)
      const savePromise = addDoc(collection(db, "products"), productData)
      const saveTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("데이터 저장 시간 초과 (30초)")), 30000)
      )
      
      await Promise.race([savePromise, saveTimeoutPromise])
      console.log("제품 저장 완료!")
      setUploadStatus("제품 등록 완료!")
      
      alert("제품이 성공적으로 추가되었습니다 ✅")
      setForm({ name: "", price: "", description: "", imageUrl: "", active: true, sizes: [], colors: [] })
      setImageFile(null)
      setImagePreview("")
      setUploadStatus("")
      setUploadProgress(0)
      setRetryCount(0)
    } catch (err) {
      console.error("업로드 에러:", err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      setUploadStatus(`에러: ${errorMessage}`)
      
      // 에러 타입에 따른 구체적인 메시지
      let userMessage = `제품 추가에 실패했습니다 ❌\n\n에러: ${errorMessage}`
      
      if (errorMessage.includes("시간 초과")) {
        userMessage += "\n\n네트워크 연결이 불안정하거나 서버 응답이 느립니다. 다시 시도해주세요."
      } else if (errorMessage.includes("권한")) {
        userMessage += "\n\nFirebase 권한 설정을 확인해주세요."
      } else if (errorMessage.includes("크기")) {
        userMessage += "\n\n더 작은 이미지 파일을 선택해주세요."
      }
      
      userMessage += "\n\n문제가 지속되면 개발자 도구(F12)의 콘솔을 확인해주세요."
      
      alert(userMessage)
    } finally {
      clearTimeout(overallTimeout)
      console.log("업로드 상태 초기화")
      setUploading(false)
      // 상태 메시지는 5초 후에 자동으로 사라짐
      if (uploadStatus && !uploadStatus.includes("에러")) {
        setTimeout(() => {
          setUploadStatus("")
          setUploadProgress(0)
          setRetryCount(0)
        }, 5000)
      }
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">제품 등록</h1>
          <p className="text-purple-100 mt-1">새로운 댄스 의상을 추가하세요</p>
          
          {/* Firebase 연결 상태 표시 */}
          {firebaseConnected !== null && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm">
                {firebaseConnected ? (
                  <>
                    <span className="text-green-200">✅</span>
                    <span className="text-green-200">Firebase 연결됨</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-200">❌</span>
                    <span className="text-red-200">Firebase 연결 실패</span>
                  </>
                )}
              </div>
              
              {/* Base64 이미지 저장 안내 */}
              <div className="text-xs text-green-200 bg-green-800/30 rounded-lg p-2">
                <div className="font-semibold">✅ 압축된 Base64 이미지 저장:</div>
                <div className="mt-1">
                  • 이미지 자동 압축 (800px, 70% 품질)<br/>
                  • Base64로 변환하여 Firestore에 저장<br/>
                  • Firebase Storage 불필요 (무료 플랜 사용 가능)<br/>
                  • 최대 파일 크기: 10MB (압축 후 1MB 이하)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 제품명 */}
          <label className="grid gap-3">
            <span className="text-sm font-semibold text-gray-700">제품명</span>
            <input
              type="text"
              value={form.name}
              onChange={handleNameChange}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="제품명을 입력하세요"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>

          {/* 가격 */}
          <label className="grid gap-3">
            <span className="text-sm font-semibold text-gray-700">가격 (원)</span>
            <input
              type="number"
              value={form.price}
              onChange={handlePriceChange}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="가격을 입력하세요"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
            />
          </label>

          {/* 제품 설명 */}
          <label className="grid gap-3">
            <span className="text-sm font-semibold text-gray-700">제품 설명</span>
            <textarea
              value={form.description}
              onChange={handleDescriptionChange}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 min-h-32 text-base focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="제품의 특징과 설명을 입력하세요..."
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>

          {/* 이미지 업로드 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">제품 이미지</label>
            
            {/* 이미지 미리보기 */}
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="미리보기" 
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview("")
                    setImageFile(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* 업로드 옵션 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 카메라 버튼 */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="camera-upload"
                />
                <label
                  htmlFor="camera-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div className="text-2xl mb-1">📷</div>
                  <p className="text-xs font-medium text-gray-700">카메라</p>
                </label>
              </div>

              {/* 갤러리 버튼 */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="gallery-upload"
                />
                <label
                  htmlFor="gallery-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs font-medium text-gray-700">갤러리</p>
                </label>
              </div>
            </div>
          </div>

          {/* 이미지 URL */}
          <label className="grid gap-3">
            <span className="text-sm font-semibold text-gray-700">이미지 URL (선택사항)</span>
            <input
              type="url"
              value={form.imageUrl}
              onChange={handleImageUrlChange}
              className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="이미지 URL을 입력하세요"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>

          {/* 사이즈 관리 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">사이즈 설정</label>
            
            {/* 사이즈 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="사이즈 입력 (예: S, M, L, XL)"
                autoComplete="off"
                onKeyPress={(e) => e.key === 'Enter' && addSize()}
              />
              <button
                type="button"
                onClick={addSize}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                추가
              </button>
            </div>
            
            {/* 사이즈 목록 */}
            {form.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.sizes.map((size, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="text-purple-600 hover:text-purple-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 색상 관리 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">색상 설정</label>
            
            {/* 색상 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="색상 입력 (예: 빨강, 파랑, 검정)"
                autoComplete="off"
                onKeyPress={(e) => e.key === 'Enter' && addColor()}
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors font-medium"
              >
                추가
              </button>
            </div>
            
            {/* 색상 목록 */}
            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.colors.map((color, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-pink-100 text-pink-800 rounded-lg text-sm font-medium"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="text-pink-600 hover:text-pink-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-base font-medium text-gray-700">활성화 (판매중)</span>
          </label>

          {/* 업로드 상태 표시 */}
          {uploadStatus && (
            <div className={`p-3 rounded-xl text-sm font-medium ${
              uploadStatus.includes("에러") 
                ? "bg-red-100 text-red-700 border border-red-200" 
                : uploadStatus.includes("완료")
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}>
              <div className="flex items-center gap-2">
                {!uploadStatus.includes("에러") && !uploadStatus.includes("완료") && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
                {uploadStatus.includes("완료") && (
                  <span className="text-green-600">✅</span>
                )}
                {uploadStatus.includes("에러") && (
                  <span className="text-red-600">❌</span>
                )}
                <span>{uploadStatus}</span>
              </div>
              
              {/* 진행률 바 */}
              {uploadProgress > 0 && !uploadStatus.includes("에러") && !uploadStatus.includes("완료") && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-blue-600 font-medium">
                      {uploadProgress}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {uploadStatus.includes("재시도") ? uploadStatus :
                       uploadProgress < 30 ? "압축 중..." : 
                       uploadProgress < 90 ? "업로드 중..." : 
                       uploadProgress < 100 ? "처리 중..." : "완료"}
                      {retryCount > 0 && !uploadStatus.includes("재시도") && (
                        <span className="text-orange-600"> (재시도 {retryCount}회)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                업로드 중...
              </div>
            ) : (
              "제품 등록하기"
            )}
          </button>
        </form>

        {/* 하단 네비게이션 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-center gap-4">
            <Link href="/admin" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              ← 관리자 페이지
            </Link>
            <Link href="/products" className="text-pink-600 hover:text-pink-700 font-medium text-sm">
              제품 보기 →
            </Link>
            <button
              onClick={() => handleLogout(router)}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}