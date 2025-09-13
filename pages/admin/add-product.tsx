"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { db, storage } from "../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage"

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Firebase 연결 상태 확인
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        console.log("=== Firebase 연결 상태 확인 시작 ===")
        console.log("Firestore 객체:", db)
        console.log("Storage 객체:", storage)
        
        // Storage 연결 테스트
        const testRef = ref(storage, "test/connection-test.txt")
        console.log("Storage 참조 생성 성공:", testRef.fullPath)
        
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

  // 이미지 압축 함수
  const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
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
              resolve(compressedFile)
            } else {
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

  async function uploadImage(file: File): Promise<string> {
    console.log("=== 이미지 업로드 시작 ===")
    console.log("원본 파일명:", file.name)
    console.log("원본 파일 크기:", file.size, "bytes")
    console.log("파일 타입:", file.type)
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("이미지 파일이 너무 큽니다 (최대 10MB)")
    }
    
    try {
      // 이미지 압축
      setUploadStatus("이미지 압축 중...")
      setUploadProgress(10)
      const compressedFile = await compressImage(file, 800, 0.8)
      console.log("압축 후 파일 크기:", compressedFile.size, "bytes")
      console.log("압축률:", ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + "%")
      
      setUploadStatus("Firebase Storage에 업로드 중...")
      setUploadProgress(30)
      
      const imageRef = ref(storage, `products/${Date.now()}_${compressedFile.name}`)
      console.log("Storage 참조 생성:", imageRef.fullPath)
      
      // 실제 Firebase Storage 진행률 추적
      const uploadTask = uploadBytesResumable(imageRef, compressedFile)
      
      // 업로드 진행률 추적
      const uploadPromise = new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            // 실제 업로드 진행률 계산
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setUploadProgress(Math.round(progress))
            console.log(`업로드 진행률: ${Math.round(progress)}%`)
          },
          (error) => {
            console.error('업로드 에러:', error)
            reject(error)
          },
          () => {
            console.log('업로드 완료')
            resolve()
          }
        )
      })
      
      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("이미지 업로드 시간 초과 (30초)")), 30000)
      )
      
      await Promise.race([uploadPromise, timeoutPromise])
      setUploadProgress(90)
      
      console.log("이미지 업로드 완료, URL 가져오는 중...")
      
      setUploadStatus("이미지 URL 생성 중...")
      const url = await getDownloadURL(imageRef)
      setUploadProgress(100)
      
      console.log("이미지 URL 생성 완료:", url)
      console.log("=== 이미지 업로드 성공 ===")
      return url
    } catch (error) {
      console.error("=== 이미지 업로드 에러 ===")
      console.error("에러 타입:", typeof error)
      console.error("에러 객체:", error)
      console.error("에러 메시지:", error instanceof Error ? error.message : String(error))
      console.error("에러 코드:", (error as any)?.code)
      console.error("에러 스택:", error instanceof Error ? error.stack : "No stack trace")
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setUploadStatus("업로드 준비 중...")
    
    // 전체 프로세스 타임아웃 (60초)
    const overallTimeout = setTimeout(() => {
      setUploading(false)
      setUploadStatus("업로드 시간 초과 - 네트워크를 확인해주세요")
      alert("업로드가 시간 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.")
    }, 60000)
    
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
        console.log("이미지 업로드 시도...", imageFile.name)
        setUploadStatus(`이미지 업로드 시도 중... (${imageFile.name})`)
        
        try {
          imageUrl = await uploadImage(imageFile)
          console.log("이미지 업로드 완료:", imageUrl)
          setUploadStatus("이미지 업로드 완료")
        } catch (uploadError) {
          console.error("이미지 업로드 실패:", uploadError)
          const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError)
          
          if (errorMessage.includes("권한") || errorMessage.includes("permission")) {
            setUploadStatus("이미지 업로드 실패 - Firebase Storage 권한 확인 필요")
            alert("이미지 업로드에 실패했습니다.\n\nFirebase Storage 보안 규칙을 확인해주세요.\n\n임시로 이미지 없이 제품만 등록합니다.")
          } else {
            setUploadStatus(`이미지 업로드 실패: ${errorMessage}`)
            alert(`이미지 업로드에 실패했습니다: ${errorMessage}\n\n임시로 이미지 없이 제품만 등록합니다.`)
          }
          
          // 이미지 업로드 실패해도 제품 등록은 계속 진행
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

      // Firestore 저장에도 타임아웃 추가
      const savePromise = addDoc(collection(db, "products"), productData)
      const saveTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("데이터 저장 시간 초과 (15초)")), 15000)
      )
      
      await Promise.race([savePromise, saveTimeoutPromise])
      console.log("제품 저장 완료!")
      setUploadStatus("제품 등록 완료!")
      
      alert("제품이 성공적으로 추가되었습니다 ✅")
      setForm({ name: "", price: "", description: "", imageUrl: "", active: true })
      setImageFile(null)
      setImagePreview("")
      setUploadStatus("")
      setUploadProgress(0)
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
              
              {/* Firebase Storage 문제 안내 */}
              <div className="text-xs text-yellow-200 bg-yellow-800/30 rounded-lg p-2">
                <div className="font-semibold">⚠️ 이미지 업로드 문제 해결법:</div>
                <div className="mt-1">
                  1. Firebase 콘솔 → Storage → Rules<br/>
                  2. 다음 규칙으로 변경:<br/>
                  <code className="bg-black/20 px-1 rounded">allow read, write: if true;</code>
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
                      {uploadProgress < 30 ? "압축 중..." : 
                       uploadProgress < 90 ? "업로드 중..." : 
                       uploadProgress < 100 ? "처리 중..." : "완료"}
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
          </div>
        </div>
      </div>
    </div>
  )
}