import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useUser } from "../../context/UserContext"
import Link from "next/link"

export default function ProductDetail() {
  const router = useRouter()
  const { productId } = router.query
  const [product, setProduct] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [orderQuantities, setOrderQuantities] = useState<{[size: string]: number}>({})
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [isOrdering, setIsOrdering] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (!productId) return
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", productId as string))
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() })
    }
    fetchProduct()
  }, [productId])

  useEffect(() => {
    if (user) {
      const fetchUserInfo = async () => {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        if (userSnap.exists()) {
          setUserInfo({ id: userSnap.id, ...userSnap.data() })
        }
      }
      fetchUserInfo()
    }
  }, [user])

  // 사이즈별 수량 변경 함수
  const updateQuantity = (size: string, quantity: number) => {
    setOrderQuantities(prev => ({
      ...prev,
      [size]: quantity
    }))
  }

  // 주문하기 함수
  const handleOrder = async () => {
    if (!user || !product || !userInfo) {
      alert("로그인이 필요합니다.")
      return
    }

    // 주문할 수량이 있는지 확인
    const hasQuantity = Object.values(orderQuantities).some(qty => qty > 0)
    if (!hasQuantity) {
      alert("주문할 수량을 선택해주세요.")
      return
    }

    if (!selectedColor) {
      alert("색상을 선택해주세요.")
      return
    }

    setIsOrdering(true)

    try {
      // 각 사이즈별로 주문 생성
      for (const [size, quantity] of Object.entries(orderQuantities)) {
        if (quantity > 0) {
          await addDoc(collection(db, "orders"), {
            customerId: user.uid,
            productId: product.id,
            customerName: userInfo.name || userInfo.email,
            productName: product.name,
            selectedSize: size,
            selectedColor: selectedColor,
            quantity: quantity,
            status: "pending",
            deliveryAddress: userInfo.address || "",
            phoneNumber: userInfo.phone || "",
            specialRequests: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
      }

      alert("주문이 완료되었습니다!")
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">제품 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Rhythm</Link>
              <span className="ml-2 text-gray-500">Dance Wear</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/products" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                제품 보기
              </Link>
              {user && (
                <Link href="/my-info" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  내 정보
                </Link>
              )}
              {!user && (
                <Link href="/login" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-all">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로 돌아가기 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 돌아가기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 이미지 영역 */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl.startsWith('data:') ? product.imageUrl : product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">이미지 없음</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 제품 정보 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-3xl text-purple-600 font-bold mb-6">
                ₩{product.price?.toLocaleString()}
              </p>
            </div>

            {product.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">제품 설명</h3>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* 주문 폼 */}
            {user ? (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주문하기</h3>
                
                {/* 색상 선택 */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">색상 선택 <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedColor === color
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 사이즈별 수량 선택 */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">사이즈별 수량 선택 <span className="text-red-500">*</span></p>
                    <div className="space-y-3">
                      {product.sizes.map((size: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{size}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(size, Math.max(0, (orderQuantities[size] || 0) - 1))}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                              disabled={!orderQuantities[size] || orderQuantities[size] <= 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {orderQuantities[size] || 0}
                            </span>
                            <button
                              onClick={() => updateQuantity(size, (orderQuantities[size] || 0) + 1)}
                              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 주문 요약 */}
                {Object.values(orderQuantities).some(qty => qty > 0) && selectedColor && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">주문 요약</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      {Object.entries(orderQuantities).map(([size, quantity]) => (
                        quantity > 0 && (
                          <div key={size} className="flex justify-between">
                            <span>{size} 사이즈 - {selectedColor}</span>
                            <span>{quantity}개</span>
                          </div>
                        )
                      ))}
                      <div className="border-t border-purple-200 pt-2 mt-2 font-medium">
                        총 수량: {Object.values(orderQuantities).reduce((sum, qty) => sum + qty, 0)}개
                      </div>
                    </div>
                  </div>
                )}

                {/* 주문하기 버튼 */}
                <button
                  onClick={handleOrder}
                  disabled={isOrdering || !Object.values(orderQuantities).some(qty => qty > 0) || !selectedColor}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  {isOrdering ? "주문 처리 중..." : "주문하기"}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">로그인 후 주문하세요</h3>
                <p className="text-gray-600 mb-4">주문하려면 로그인이 필요합니다.</p>
                <Link 
                  href="/login" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  로그인하기
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}