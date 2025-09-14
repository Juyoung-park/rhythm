import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { handleLogout } from "../lib/auth";
import Link from "next/link";
import { useRouter } from "next/router";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  imageUrl?: string;
  sizes?: string[];
  colors?: string[];
  active?: boolean;
  createdAt?: any;
}

export default function ProductsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        console.log("Fetching products from Firebase...");
        
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        console.log(`Found ${querySnapshot.size} products`);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setProducts(productsData);
        console.log("Products loaded successfully:", productsData);
      } catch (error: unknown) {
        console.error("Error fetching products:", error);
        setError("제품을 불러오는 중 오류가 발생했습니다.");
        
        // Show specific error messages
        if (error && typeof error === 'object' && 'code' in error) {
          if ((error as any).code === "permission-denied") {
            setError("Firebase Firestore 권한 오류입니다. Firebase Console에서 보안 규칙을 확인해주세요.");
          } else if ((error as any).code === "unavailable") {
            setError("Firebase 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserInfo = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserInfo(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      };
      fetchUserInfo();
    }
  }, [user]);

  const categories = ["all", "dress", "top", "bottom", "accessory"];
  
  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === "all" || (product.category || "기타") === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return 0; // Already sorted by createdAt in query
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">제품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Rhythm</Link>
              <span className="ml-2 text-gray-500">Dance Wear</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                홈
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
            수제작 라인댄스 의상
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">제품 카탈로그</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">개인 맞춤형 수제작 라인댄스 의상을 만나보세요</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error?.includes("권한") && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-semibold text-yellow-800 mb-2">Firebase Firestore 보안 규칙 수정 방법:</div>
                        <div className="text-yellow-700 text-xs">
                          1. Firebase 콘솔 → Firestore Database → Rules<br/>
                          2. 다음 규칙으로 변경:<br/>
                          <code className="bg-yellow-100 px-1 rounded text-xs">
                            allow read, write: if true;
                          </code>
                        </div>
                      </div>
                    )}
                    <div className="mt-2">
                      <Link href="/firebase-test" className="text-red-800 underline">
                        Firebase 연결 테스트하기
                      </Link>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-lg">
            총 <span className="font-bold text-purple-600">{filteredProducts.length}</span>개의 제품을 찾았습니다
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="제품명이나 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category and Sort Filters */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Category Filter */}
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {category === "all" ? "전체" : 
                   category === "dress" ? "드레스" :
                   category === "top" ? "상의" :
                   category === "bottom" ? "하의" : "액세서리"}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm"
              >
                <option value="newest">최신순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
                <option value="name">이름순</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error ? "오류로 인해 제품을 불러올 수 없습니다" : "제품이 없습니다"}
            </h3>
            <p className="text-gray-600 mb-4">
              {error ? "Firebase 설정을 확인해주세요" : "곧 새로운 제품이 추가될 예정입니다."}
            </p>
            {user && user.email === "admin@rhythm.com" && (
              <Link href="/admin/add-product" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                첫 번째 제품 추가하기
              </Link>
            )}
          </div>
        ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Clickable Product Card */}
                <Link href={`/order/${product.id}`} className="block">
                  {/* Product Image */}
                  <div className="relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl.startsWith('data:') ? product.imageUrl : product.imageUrl}
                        alt={product.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-5 h-5 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-400">이미지 없음</p>
                        </div>
                      </div>
                    )}
                    {/* Category Badge */}
                    {(product.category || product.active !== false) && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                          {product.category === "dress" ? "드레스" :
                           product.category === "top" ? "상의" :
                           product.category === "bottom" ? "하의" : 
                           product.category === "accessory" ? "액세서리" : "기타"}
                        </span>
                      </div>
                    )}
                    {/* Click Indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    
                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-lg font-bold text-purple-600">
                        ₩{product.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">색상</p>
                        <div className="flex flex-wrap gap-1">
                          {product.colors.slice(0, 2).map((color, index) => (
                            <span key={index} className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {color}
                            </span>
                          ))}
                          {product.colors.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{product.colors.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">사이즈</p>
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.slice(0, 3).map((size, index) => (
                            <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                              {size}
                            </span>
                          ))}
                          {product.sizes.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{product.sizes.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Details Hint */}
                    <div className="mt-3 text-center">
                      <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        클릭하여 상세보기
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 