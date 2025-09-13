"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { db, storage } from "../../lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

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

  async function uploadImage(file: File): Promise<string> {
    const imageRef = ref(storage, `products/${Date.now()}_${file.name}`)
    await uploadBytes(imageRef, file)
    return await getDownloadURL(imageRef)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    
    try {
      console.log("업로드 시작...")
      let imageUrl = form.imageUrl
      
      // 이미지 파일이 있으면 업로드
      if (imageFile) {
        console.log("이미지 업로드 중...", imageFile.name)
        imageUrl = await uploadImage(imageFile)
        console.log("이미지 업로드 완료:", imageUrl)
      }

      console.log("Firestore에 제품 데이터 저장 중...")
      const productData = {
        ...form,
        price: Number(form.price),
        imageUrl,
        createdAt: serverTimestamp(),
      }
      console.log("저장할 데이터:", productData)

      await addDoc(collection(db, "products"), productData)
      console.log("제품 저장 완료!")
      
      alert("제품이 추가되었습니다 ✅")
      setForm({ name: "", price: "", description: "", imageUrl: "", active: true })
      setImageFile(null)
      setImagePreview("")
    } catch (err) {
      console.error("업로드 에러:", err)
      alert(`제품 추가에 실패했습니다 ❌\n에러: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      console.log("업로드 상태 초기화")
      setUploading(false)
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