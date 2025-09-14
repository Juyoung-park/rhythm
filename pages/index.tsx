import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-8">
      <div className="text-center space-y-8 max-w-4xl w-full">
        {/* 로고 */}
        <div className="mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="text-8xl mb-6">💃</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Rhythm
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mt-2">Dance Wear</p>
          </div>
        </div>

        {/* 로그인/회원가입 메뉴 */}
        <div className="flex justify-center gap-6 mt-8">
          <Link
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            로그인
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}