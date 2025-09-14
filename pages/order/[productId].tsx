import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useUser } from "../../context/UserContext"
import { handleLogout } from "../../lib/auth"
import Link from "next/link"

export default function ProductDetail() {
  const router = useRouter()
  const { productId } = router.query
  const [product, setProduct] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [orderQuantities, setOrderQuantities] = useState<{[color: string]: {[size: string]: number}}>({})
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
                <>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600">
                      안녕하세요, <span className="font-medium text-purple-600">{userInfo?.name || user.email}</span>님
                    </div>
                  </div>
                  <Link href="/my-info" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    내 정보
                  </Link>
                  <button
                    onClick={() => handleLogout(router)}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    로그아웃
                  </button>
                </>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이미지 영역 */}
          <div className="lg:col-span-1">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">이미지 없음</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 제품 정보 */}
          <div className="lg:col-span-2 space-y-6">
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
          </div>
        </div>

        {/* 주문 카드 영역 */}
        {user ? (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m0 0h9m-9 0v1a2 2 0 002 2h5a2 2 0 002-2v-1" />
                  </svg>
                  주문하기
                </h2>
              </div>
              
              <div className="p-6">
                {/* 색상별 주문 관리 */}
                {product.colors && product.colors.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        색상별 주문하기
                      </h3>
                      <p className="text-gray-600 text-sm">각 색상마다 다른 사이즈와 수량을 선택할 수 있습니다</p>
                    </div>
                    
                    {/* 색상 선택 버튼들 */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                                selectedColor === color
                                  ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-300"
                                  : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-800 border-2 border-transparent"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full mr-3 ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-gray-300' : 'bg-gray-400'}`}></div>
                              {color}
                              {hasQuantity && (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedColor === color 
                                    ? "bg-white text-purple-600" 
                                    : "bg-green-100 text-green-800"
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
                      <div className="border border-gray-200 rounded-xl p-4 bg-purple-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${selectedColor === '빨강' ? 'bg-red-500' : selectedColor === '파랑' ? 'bg-blue-500' : selectedColor === '검정' ? 'bg-black' : selectedColor === '흰색' ? 'bg-white border border-gray-300' : 'bg-gray-400'}`}></div>
                            {selectedColor} 선택됨
                            <span className="ml-2 text-sm text-purple-600">이 색상의 사이즈와 수량을 조절하세요</span>
                          </h4>
                        </div>
                        
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="space-y-2">
                            {product.sizes.map((size: string, sizeIndex: number) => {
                              // 선택된 색상의 특정 사이즈 수량을 안전하게 가져오기
                              const currentQuantity = (orderQuantities[selectedColor] && orderQuantities[selectedColor][size]) || 0
                              
                              return (
                                <div key={`size-${selectedColor}-${sizeIndex}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                                  <span className="text-sm font-medium text-gray-700">{size}</span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => updateQuantity(selectedColor, size, Math.max(0, currentQuantity - 1))}
                                      className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-gray-700 font-bold transition-colors"
                                      disabled={currentQuantity <= 0}
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-bold text-gray-900">
                                      {currentQuantity}
                                    </span>
                                    <button
                                      onClick={() => updateQuantity(selectedColor, size, currentQuantity + 1)}
                                      className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white font-bold transition-colors"
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
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
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
                            <div key={`status-${colorIndex}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-gray-300' : 'bg-gray-400'}`}></div>
                                <span className="font-medium text-green-900">{color}</span>
                              </div>
                              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        사이즈별 수량 선택
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                      <div className="space-y-3">
                        {product.sizes.map((size: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-colors">
                            <span className="text-lg font-medium text-gray-700">{size}</span>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => updateQuantity("기본", size, Math.max(0, getQuantityForColor("기본", size) - 1))}
                                className="w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
                                disabled={getQuantityForColor("기본", size) <= 0}
                              >
                                −
                              </button>
                              <span className="w-12 text-center font-bold text-xl text-gray-900">
                                {getQuantityForColor("기본", size)}
                              </span>
                              <button
                                onClick={() => updateQuantity("기본", size, getQuantityForColor("기본", size) + 1)}
                                className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white font-bold text-lg transition-colors"
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
                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4 flex items-center text-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      주문 요약
                    </h4>
                    <div className="space-y-3">
                      {/* 각 색상별로 독립적으로 주문 요약 생성 */}
                      {product.colors && product.colors.length > 0 && product.colors.map((color: string, colorIndex: number) => {
                        const colorQuantities = orderQuantities[color] || {}
                        const hasColorQuantity = Object.values(colorQuantities).some(qty => qty > 0)
                        
                        if (!hasColorQuantity) return null
                        
                        return (
                          <div key={`order-summary-${colorIndex}-${color}`} className="border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center mb-2">
                              <div className={`w-3 h-3 rounded-full mr-2 ${color === '빨강' ? 'bg-red-500' : color === '파랑' ? 'bg-blue-500' : color === '검정' ? 'bg-black' : color === '흰색' ? 'bg-white border border-gray-300' : 'bg-gray-400'}`}></div>
                              <span className="font-semibold text-purple-900">{color}</span>
                            </div>
                            <div className="space-y-1 ml-5">
                              {product.sizes && product.sizes.map((size: string, sizeIndex: number) => {
                                const quantity = colorQuantities[size] || 0
                                
                                if (quantity <= 0) return null
                                
                                return (
                                  <div key={`order-size-${colorIndex}-${sizeIndex}-${size}`} className="flex justify-between items-center">
                                    <span className="text-purple-800">{size} 사이즈</span>
                                    <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm font-bold">{quantity}개</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      <div className="border-t border-purple-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-purple-900">총 수량</span>
                          <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-lg font-bold">
                            {Object.values(orderQuantities).reduce((colorSum, colorQuantities) => 
                              colorSum + Object.values(colorQuantities).reduce((sizeSum, qty) => sizeSum + qty, 0), 0
                            )}개
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 주문하기 버튼 */}
                <div className="mt-8">
                  <button
                    onClick={handleOrder}
                    disabled={isOrdering || !hasAnyQuantity()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
                  >
                    {isOrdering ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        주문 처리 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m0 0h9m-9 0v1a2 2 0 002 2h5a2 2 0 002-2v-1" />
                        </svg>
                        주문하기
                      </>
                    )}
                  </button>
                  
                  {/* 주문 조건 안내 */}
                  {!hasAnyQuantity() && (
                    <p className="text-center text-gray-500 mt-2 text-sm">수량을 선택해주세요</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">로그인 후 주문하세요</h3>
                <p className="text-gray-600">주문하려면 로그인이 필요합니다.</p>
              </div>
              <Link 
                href="/login" 
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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