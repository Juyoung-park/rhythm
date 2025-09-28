import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import type { DocumentData } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useUser } from "../../context/UserContext"
import { handleLogout } from "../../lib/auth"
import Link from "next/link"

interface ProductRecord {
  id: string
  name: string
  description?: string
  price?: number
  colors?: string[]
  sizes?: string[]
  imageUrl?: string
}

interface UserProfile {
  id: string
  name?: string
  email?: string
  address?: string
  phone?: string
  [key: string]: unknown
}

export default function ProductDetail() {
  const router = useRouter()
  const { productId } = router.query
  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null)
  const [orderQuantities, setOrderQuantities] = useState<{[color: string]: {[size: string]: number}}>({})
  const [selectedColor, setSelectedColor] = useState<string>("")
  
  const [isOrdering, setIsOrdering] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (!productId) return
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", productId as string))
      if (snap.exists()) {
        setProduct({ id: snap.id, ...(snap.data() as DocumentData) } as ProductRecord)
      }
    }
    fetchProduct()
  }, [productId])

  useEffect(() => {
    if (user) {
      const fetchUserInfo = async () => {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        if (userSnap.exists()) {
          setUserInfo({ id: userSnap.id, ...(userSnap.data() as DocumentData) } as UserProfile)
        }
      }
      fetchUserInfo()
    }
  }, [user])

  // 색상별 사이즈별 수량 변경 함수 - 완전히 안전한 방식
  const updateQuantity = (color: string, size: string, quantity: number) => {
    setOrderQuantities(prev => {
      // 새로운 상태 객체 생성
      const newState: {[color: string]: {[size: string]: number}} = {}
      
      // 기존 모든 색상 데이터 복사 (완전히 새로운 객체로)
      for (const existingColor in prev) {
        newState[existingColor] = {}
        for (const existingSize in prev[existingColor]) {
          newState[existingColor][existingSize] = prev[existingColor][existingSize]
        }
      }
      
      // 현재 색상의 데이터 업데이트
      if (!newState[color]) {
        newState[color] = {}
      }
      newState[color][size] = quantity
      
      return newState
    })
  }

  // 특정 색상의 특정 사이즈 수량 가져오기
  const getQuantityForColor = (color: string, size: string) => {
    return orderQuantities[color]?.[size] || 0
  }

  // 모든 색상의 총 주문 수량 확인
  const hasAnyQuantity = () => {
    return Object.values(orderQuantities).some(colorQuantities => 
      Object.values(colorQuantities).some(qty => qty > 0)
    )
  }

  const totalSelectedQuantity = Object.values(orderQuantities).reduce((colorSum, colorQuantities) => {
    return (
      colorSum +
      Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + qty, 0)
    )
  }, 0)

  // 주문하기 함수
  const handleOrder = async () => {
    if (!user || !product || !userInfo) {
      alert("로그인이 필요합니다.")
      return
    }

    // 주문할 수량이 있는지 확인
    if (!hasAnyQuantity()) {
      alert("주문할 수량을 선택해주세요.")
      return
    }

    setIsOrdering(true)

    try {
      let orderCount = 0
      
      // 모든 색상과 사이즈 조합으로 주문 생성
      for (const [color, colorQuantities] of Object.entries(orderQuantities)) {
        for (const [size, quantity] of Object.entries(colorQuantities)) {
          if (quantity > 0) {
            await addDoc(collection(db, "orders"), {
              customerId: user.uid,
              productId: product.id,
              customerName: userInfo.name || userInfo.email,
              productName: product.name,
              selectedSize: size,
              selectedColor: color,
              quantity: quantity,
              status: "pending",
              deliveryAddress: userInfo.address || "",
              phoneNumber: userInfo.phone || "",
              specialRequests: "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            orderCount++
          }
        }
      }

      alert(`${orderCount}개의 주문이 완료되었습니다!`)
      router.push("/my-info")
    } catch (error) {
      console.error("주문 오류:", error)
      alert("주문 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsOrdering(false)
    }
  }

  if (!product) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-radial" />
        <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-primary-200/30 via-transparent to-transparent" />
        <div className="glass-panel rounded-3xl px-12 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-b-transparent" />
          </div>
          <p className="mt-6 text-base font-medium text-neutral-600">제품 정보를 불러오는 중입니다. 잠시만 기다려 주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary-200/35 via-transparent to-transparent" />

      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/products" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Rhythm</p>
              <p className="text-sm font-semibold text-neutral-900">제품 상세</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link href="/products" className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block">
              카탈로그
            </Link>
            {user ? (
              <>
                <Link href="/my-info" className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block">
                  내 정보
                </Link>
                <button
                  onClick={() => handleLogout(router)}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 px-5 py-2 text-white shadow-glow transition hover:-translate-y-0.5"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* 뒤로 돌아가기 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 돌아가기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이미지 영역 */}
          <div className="lg:col-span-1">
            <div className="aspect-square overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-lifted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl.startsWith('data:') ? product.imageUrl : product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-300">
                  <div className="text-center">
                    <svg className="mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-neutral-500">이미지 없음</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 제품 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-neutral-900 md:text-4xl">{product.name}</h1>
              <p className="text-3xl font-semibold text-neutral-900">
                <span className="text-sm font-medium uppercase tracking-[0.3em] text-primary-600">Price</span>
                <br />
                ₩{product.price?.toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-inner shadow-white/40">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">제품 설명</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 주문 카드 영역 */}
        {user ? (
          <div className="mt-12">
            <div className="glass-panel rounded-3xl p-0 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/30 bg-white/70 px-8 py-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m0 0h9m-9 0v1a2 2 0 002 2h5a2 2 0 002-2v-1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-900">주문하기</h2>
                    <p className="text-sm text-neutral-500">색상과 사이즈 별로 원하는 수량을 자유롭게 조합해 보세요.</p>
                    {totalSelectedQuantity > 0 && (
                      <span className="mt-3 inline-flex items-center rounded-full border border-primary-200/60 bg-primary-50/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-600">
                        총 {totalSelectedQuantity}개 선택됨
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* 색상별 주문 관리 */}
                {product.colors && product.colors.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        색상별 주문하기
                      </h3>
                      <p className="text-neutral-600 text-sm">각 색상마다 다른 사이즈와 수량을 선택할 수 있습니다</p>
                    </div>
                    
                    {/* 색상 선택 버튼들 */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        색상 선택
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {product.colors.map((color: string, colorIndex: number) => {
                          // 각 색상별로 완전히 독립적인 수량 계산
                          const colorQuantities = orderQuantities[color] || {}
                          const hasQuantity = Object.values(colorQuantities).some(qty => qty > 0)
                          const totalQuantity = Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0)
                          
                          return (
                            <button
                              key={`color-btn-${colorIndex}`}
                              onClick={() => setSelectedColor(color)}
                              className={`flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition duration-300 ease-soft ${
                                selectedColor === color
                                  ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/15"
                                  : "border border-neutral-200/70 bg-white/70 text-neutral-600 hover:border-primary-200 hover:text-primary-600"
                              }`}
                            >
                              <div className={`h-4 w-4 rounded-full ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-neutral-200' : 'bg-neutral-300'}`}></div>
                              <span>{color}</span>
                              {hasQuantity && (
                                <span className={`ml-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                                  selectedColor === color
                                    ? "bg-white/90 text-primary-600"
                                    : "border border-green-200/70 bg-green-50/80 text-green-600"
                                }`}>
                                  {totalQuantity}개
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 선택된 색상의 사이즈/수량 조절 */}
                    {selectedColor && (
                      <div className="rounded-3xl border border-white/50 bg-white/70 p-6 shadow-inner shadow-white/40">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <h4 className="flex items-center text-lg font-semibold text-neutral-900">
                            <div className={`mr-3 h-4 w-4 rounded-full ${selectedColor === '빨강' ? 'bg-red-500' : selectedColor === '파랑' ? 'bg-blue-500' : selectedColor === '검정' ? 'bg-black' : selectedColor === '흰색' ? 'bg-white border border-neutral-200' : 'bg-neutral-300'}`}></div>
                            {selectedColor} 선택됨
                          </h4>
                          <div className="rounded-full border border-primary-200/60 bg-primary-50/60 px-4 py-1 text-xs font-semibold text-primary-600">
                            총 {Object.values(orderQuantities[selectedColor] || {}).reduce((sum, qty) => sum + qty, 0)}개 선택됨
                          </div>
                        </div>
                        <p className="mb-4 text-xs text-neutral-500">이 색상에 필요한 사이즈별 수량을 조절하세요.</p>
                        
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="space-y-2">
                            {product.sizes.map((size: string, sizeIndex: number) => {
                              // 선택된 색상의 특정 사이즈 수량을 안전하게 가져오기
                              const currentQuantity = (orderQuantities[selectedColor] && orderQuantities[selectedColor][size]) || 0
                              
                              return (
                                <div key={`size-${selectedColor}-${sizeIndex}`} className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3">
                                  <span className="text-sm font-semibold text-neutral-700">{size}</span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => updateQuantity(selectedColor, size, Math.max(0, currentQuantity - 1))}
                                      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/70 bg-white/80 text-neutral-600 transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600"
                                      disabled={currentQuantity <= 0}
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-bold text-neutral-900">
                                      {currentQuantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(selectedColor, size, currentQuantity + 1)}
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 색상별 주문 현황 표시 */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        주문 현황
                      </h4>
                      <div className="space-y-2">
                        {product.colors.map((color: string, colorIndex: number) => {
                          // 각 색상별로 완전히 독립적인 수량 계산
                          const colorQuantities = orderQuantities[color] || {}
                          const hasQuantity = Object.values(colorQuantities).some(qty => qty > 0)
                          const totalQuantity = Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0)
                          
                          if (!hasQuantity) return null
                          
                          return (
                            <div key={`status-${colorIndex}`} className="flex items-center justify-between rounded-2xl border border-green-200/70 bg-green-50/80 px-4 py-3">
                              <div className="flex items-center">
                                <div className={`mr-2 h-3 w-3 rounded-full ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-neutral-200' : 'bg-neutral-300'}`}></div>
                                <span className="text-sm font-semibold text-green-700">{color}</span>
                              </div>
                              <span className="rounded-full border border-green-200/70 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-green-600">
                                {totalQuantity}개 선택됨
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 색상이 없는 경우 사이즈별 수량 선택 */
                  product.sizes && product.sizes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        사이즈별 수량 선택
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                      <div className="space-y-3">
                        {product.sizes.map((size: string, index: number) => (
                          <div key={index} className="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary-200">
                            <span className="text-sm font-semibold text-neutral-700">{size}</span>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => updateQuantity("기본", size, Math.max(0, getQuantityForColor("기본", size) - 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/70 bg-white/80 text-neutral-600 transition hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600"
                                disabled={getQuantityForColor("기본", size) <= 0}
                              >
                                −
                              </button>
                              <span className="w-10 text-center text-sm font-semibold text-neutral-900">
                                {getQuantityForColor("기본", size)}
                              </span>
                              <button
                                onClick={() => updateQuantity("기본", size, getQuantityForColor("기본", size) + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* 주문 요약 */}
                {hasAnyQuantity() && (
                  <div className="mt-8 rounded-3xl border border-white/50 bg-white/70 p-6 shadow-inner shadow-white/40">
                    <h4 className="mb-4 flex items-center text-lg font-semibold text-neutral-900">
                      <svg className="mr-2 h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      주문 요약
                    </h4>
                    <div className="space-y-3 text-sm">
                      {/* 각 색상별로 독립적으로 주문 요약 생성 */}
                      {product.colors && product.colors.length > 0 && product.colors.map((color: string, colorIndex: number) => {
                        const colorQuantities = orderQuantities[color] || {}
                        const hasColorQuantity = Object.values(colorQuantities).some(qty => qty > 0)
                        
                        if (!hasColorQuantity) return null
                        
                        return (
                          <div key={`order-summary-${colorIndex}-${color}`} className="rounded-2xl border border-neutral-200/60 bg-white/80 px-4 py-3">
                            <div className="mb-2 flex items-center">
                              <div className={`mr-2 h-3 w-3 rounded-full ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-neutral-200' : 'bg-neutral-300'}`}></div>
                              <span className="text-sm font-semibold text-neutral-800">{color}</span>
                            </div>
                            <div className="ml-5 space-y-1">
                              {product.sizes && product.sizes.map((size: string, sizeIndex: number) => {
                                const quantity = colorQuantities[size] || 0
                                
                                if (quantity <= 0) return null
                                
                                return (
                                  <div key={`order-size-${colorIndex}-${sizeIndex}-${size}`} className="flex items-center justify-between">
                                    <span className="text-neutral-500">{size} 사이즈</span>
                                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">{quantity}개</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      <div className="mt-4 border-t border-white/40 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">총 수량</span>
                          <span className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                            {totalSelectedQuantity}개
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 주문하기 버튼 */}
                <div className="mt-10">
                  <button
                    onClick={handleOrder}
                    disabled={isOrdering || !hasAnyQuantity()}
                    className="flex w-full items-center justify-center rounded-full bg-neutral-900 px-6 py-4 text-sm font-semibold text-white shadow-glow transition duration-500 ease-soft hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isOrdering ? (
                      <>
                        <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        주문 처리 중...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m0 0h9m-9 0v1a2 2 0 002 2h5a2 2 0 002-2v-1" />
                        </svg>
                        주문하기
                      </>
                    )}
                  </button>
                  
                  {/* 주문 조건 안내 */}
                  {!hasAnyQuantity() && (
                    <p className="mt-3 text-center text-xs text-neutral-500">주문 전 최소 한 개 이상의 수량을 지정해주세요.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-12">
            <div className="glass-panel rounded-3xl p-10 text-center">
              <div className="mb-6 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/70 text-neutral-400">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900">로그인이 필요합니다</h3>
                  <p className="mt-2 text-sm text-neutral-500">맞춤 주문을 진행하려면 먼저 Rhythm 계정으로 로그인해 주세요.</p>
                </div>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                로그인하기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
