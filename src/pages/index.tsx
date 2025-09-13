import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center space-y-8">
        {/* 로고 */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Rhythm
          </h1>
          <p className="text-xl text-gray-600">Dance Wear</p>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* 제품 등록 */}
          <Link
            href="/admin/add-product"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👗</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">제품 등록</h2>
            <p className="text-gray-600">새로운 댄스 의상을 등록합니다</p>
          </Link>

          {/* 회원 관리 */}
          <Link
            href="/admin"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👥</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">회원 관리</h2>
            <p className="text-gray-600">고객 정보와 주문을 관리합니다</p>
          </Link>
        </div>

        {/* 추가 링크 */}
        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/products"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            제품 보기 →
          </Link>
          <Link
            href="/login"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            로그인 →
          </Link>
        </div>
      </div>
    </div>
  )
}