"use client"

import { useState, useMemo } from "react"
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

  async function uploadImage(file: File): Promise<string> {
    const imageRef = ref(storage, `products/${Date.now()}_${file.name}`)
    await uploadBytes(imageRef, file)
    return await getDownloadURL(imageRef)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    
    try {
      let imageUrl = form.imageUrl
      
      // 이미지 파일이 있으면 업로드
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      await addDoc(collection(db, "products"), {
        ...form,
        price: Number(form.price),
        imageUrl,
        createdAt: serverTimestamp(),
      })
      
      alert("제품이 추가되었습니다 ✅")
      setForm({ name: "", price: "", description: "", imageUrl: "", active: true })
      setImageFile(null)
      setImagePreview("")
    } catch (err) {
      console.error(err)
      alert("제품 추가에 실패했습니다 ❌")
    } finally {
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

  const Field = useMemo(() => ({
    name: ({ label, name, type = "text" }: {
      label: string
      name: keyof typeof form
      type?: string
    }) => (
      <label className="grid gap-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <input
          type={type}
          value={form[name] as string}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }))
          }
          className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
          placeholder={label + "을(를) 입력하세요"}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </label>
    ),
    price: ({ label, name, type = "text" }: {
      label: string
      name: keyof typeof form
      type?: string
    }) => (
      <label className="grid gap-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <input
          type={type}
          value={form[name] as string}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }))
          }
          className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
          placeholder={label + "을(를) 입력하세요"}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
        />
      </label>
    ),
    default: ({ label, name, type = "text" }: {
      label: string
      name: keyof typeof form
      type?: string
    }) => (
      <label className="grid gap-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <input
          type={type}
          value={form[name] as string}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }))
          }
          className="rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-purple-500 focus:outline-none transition-colors"
          placeholder={label + "을(를) 입력하세요"}
          autoComplete="off"
        />
      </label>
    )
  }), [form])

  const FieldComponent = (props: { label: string; name: keyof typeof form; type?: string }) => {
    const component = Field[props.name] || Field.default
    return component(props)
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
          <FieldComponent label="제품명" name="name" />
          <FieldComponent label="가격 (원)" name="price" type="number" />

          <label className="grid gap-3">
            <span className="text-sm font-semibold text-gray-700">제품 설명</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
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
            
            {/* 파일 입력 */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-medium text-gray-700">
                  {imagePreview ? "다른 사진 선택" : "사진 촬영 또는 선택"}
                </p>
                <p className="text-xs text-gray-500">모바일에서 직접 촬영 가능</p>
              </label>
            </div>
          </div>

          <FieldComponent label="이미지 URL (선택사항)" name="imageUrl" />

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