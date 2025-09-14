import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { handleLogout } from "../../lib/auth";
import Link from "next/link";
import dynamic from "next/dynamic";

// Force client-side rendering
const AddTestProductPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  // Wait for router to be ready
  if (!router.isReady) {
    return <div className="p-4">로딩 중...</div>;
  }

  if (user === undefined) {
    return <div className="p-4">로딩 중...</div>;
  }

  if (!user || user.email !== "admin@rhythm.com") {
    router.push("/login");
    return <div className="p-4">관리자 권한이 필요합니다.</div>;
  }

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const addTestProduct = async () => {
    setLoading(true);
    setStatus([]);

    try {
      addStatus("테스트 제품 추가 시작...");

      const testProduct = {
        name: "테스트 라인댄스 드레스",
        description: "테스트용 라인댄스 드레스입니다. 아름다운 디자인과 편안한 착용감을 제공합니다.",
        price: 150000,
        category: "dress",
        imageUrl: null,
        sizes: ["S", "M", "L"],
        colors: ["빨강", "파랑", "검정"],
        createdAt: new Date()
      };

      addStatus("제품 데이터 준비 완료");
      console.log("Test product data:", testProduct);

      const docRef = await addDoc(collection(db, "products"), testProduct);
      addStatus(`✅ 제품이 성공적으로 추가되었습니다! ID: ${docRef.id}`);

      setTimeout(() => {
        router.push("/products");
      }, 2000);

    } catch (error: any) {
      console.error("Error adding test product:", error);
      addStatus(`❌ 오류 발생: ${error.message}`);
      
      if (error.code === "permission-denied") {
        addStatus("💡 Firebase 권한 오류입니다. 보안 규칙을 확인해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-600">Rhythm</Link>
              <span className="ml-2 text-gray-600">테스트</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                관리자 패널
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                제품보기
              </Link>
              <button
                onClick={() => handleLogout(router)}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">테스트 제품 추가</h1>
          <p className="text-gray-600">Firebase 연결을 테스트하기 위한 샘플 제품을 추가합니다</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">추가될 테스트 제품:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• 이름: 테스트 라인댄스 드레스</div>
              <div>• 가격: ₩150,000</div>
              <div>• 카테고리: 드레스</div>
              <div>• 사이즈: S, M, L</div>
              <div>• 색상: 빨강, 파랑, 검정</div>
            </div>
          </div>

          <button
            onClick={addTestProduct}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium mb-6"
          >
            {loading ? "추가 중..." : "테스트 제품 추가하기"}
          </button>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">진행 상황:</h2>
            {status.length === 0 ? (
              <p className="text-gray-500">위 버튼을 클릭하여 테스트 제품을 추가하세요</p>
            ) : (
              <div className="space-y-1">
                {status.map((message, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <Link
              href="/products"
              className="flex-1 bg-gray-600 text-white text-center py-2 rounded-lg hover:bg-gray-700"
            >
              제품 목록 보기
            </Link>
            <Link
              href="/firebase-test"
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700"
            >
              Firebase 테스트
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export with dynamic import to ensure client-side rendering
export default dynamic(() => Promise.resolve(AddTestProductPage), {
  ssr: false
}); 