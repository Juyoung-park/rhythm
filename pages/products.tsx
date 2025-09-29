import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
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
  createdAt?: Timestamp;
}

interface UserProfile {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

interface FirestoreError {
  code: string;
}

const categoryLabels: Record<string, string> = {
  all: "전체",
  dress: "드레스",
  top: "상의",
  bottom: "하의",
  accessory: "액세서리",
};

export default function ProductsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);

  const isFirestoreError = (maybeError: unknown): maybeError is FirestoreError => {
    return (
      typeof maybeError === "object" &&
      maybeError !== null &&
      "code" in maybeError &&
      typeof (maybeError as { code?: unknown }).code === "string"
    );
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
      } catch (fetchError: unknown) {
        console.error("Error fetching products:", fetchError);
        setError("제품을 불러오는 중 오류가 발생했습니다.");

        if (isFirestoreError(fetchError)) {
          if (fetchError.code === "permission-denied") {
            setError("Firebase Firestore 권한 오류입니다. Firebase Console에서 보안 규칙을 확인해주세요.");
          } else if (fetchError.code === "unavailable") {
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
    if (!user) return;

    const fetchUserInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserInfo({ ...userDoc.data() } as UserProfile);
        }
      } catch (userError) {
        console.error("Error fetching user info:", userError);
      }
    };

    fetchUserInfo();
  }, [user]);

  const categories = ["all", "dress", "top", "bottom", "accessory"];

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || (product.category || "기타") === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-radial" />
        <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-primary-200/30 via-transparent to-transparent" />
        <div className="glass-panel rounded-3xl px-12 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-b-transparent" />
          </div>
          <p className="mt-6 text-base font-medium text-neutral-600">
            제품을 불러오는 중입니다. 잠시만 기다려 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary-200/35 via-transparent to-transparent" />

      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg">
              <img 
                src="/rhythm-logo.svg" 
                alt="Rhythm 로고" 
                className="h-6 w-6 object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Rhythm</p>
              <p className="text-sm font-semibold text-neutral-900">Dance Wear Studio</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link
              href="/products"
              className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block"
            >
              홈
            </Link>
            <Link
              href="/products"
              className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block"
            >
              제품
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-neutral-600 md:inline">
                  안녕하세요, {" "}
                  <span className="font-semibold text-primary-600">{userInfo?.name || user.email}</span>
                  님
                </span>
                <Link
                  href="/my-info"
                  className="rounded-full border border-neutral-200/80 bg-white px-4 py-2 transition hover:border-primary-200 hover:text-primary-600"
                >
                  내 정보
                </Link>
                <button
                  onClick={() => handleLogout(router)}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 px-5 py-2 text-white shadow-glow transition hover:-translate-y-0.5"
              >
                로그인 / 가입
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary-600 backdrop-blur">
            Signature collection
          </span>
          <h1 className="mt-6 text-4xl font-semibold text-neutral-900 sm:text-5xl">
            무대 위 감각을 살리는
            <br />
            Rhythm 카탈로그
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">
            팀의 에너지와 콘셉트에 맞춘 맞춤형 디자인부터, 빠르게 선택할 수 있는 스테디셀러 제품까지 모두 만나보세요.
          </p>
        </div>

        {error && (
          <div className="mt-12 rounded-3xl border border-red-200/70 bg-red-50/80 p-6 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="text-base font-semibold text-red-700">제품을 불러오는 중 문제가 발생했어요</h3>
                <p className="text-red-600">{error}</p>
                {error.includes("권한") && (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4 text-xs leading-relaxed text-yellow-700">
                    <p className="font-semibold text-yellow-800">Firebase Firestore 보안 규칙 수정 방법</p>
                    <p className="mt-1">1. Firebase Console → Firestore Database → Rules</p>
                    <p className="mt-1">2. 아래 규칙으로 업데이트</p>
                    <code className="mt-2 block rounded-lg bg-yellow-100 px-3 py-2 text-[11px] font-semibold text-yellow-900">
                      allow read, write: if true;
                    </code>
                  </div>
                )}
                <Link href="/firebase-test" className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                  연결 상태 다시 확인하기
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-14">
          <div className="glass-panel flex flex-col gap-8 rounded-3xl p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span className="rounded-full bg-secondary-500/10 px-3 py-1 font-semibold text-secondary-600">
                  {filteredProducts.length}개 제품
                </span>
                <p>검색과 필터로 원하는 제품을 빠르게 찾아보세요.</p>
              </div>
              <div className="relative w-full md:w-72">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="제품명이나 설명으로 검색하세요"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 w-full rounded-full border border-white/40 bg-white/70 pl-12 pr-4 text-sm text-neutral-700 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition duration-300 ease-soft ${
                      selectedCategory === category
                        ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/15"
                        : "border border-neutral-200/70 bg-white/70 text-neutral-600 hover:border-primary-200 hover:text-primary-600"
                    }`}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-56">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-12 w-full appearance-none rounded-full border border-white/40 bg-white/80 px-4 pr-12 text-sm text-neutral-600 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="newest">최신순</option>
                  <option value="price-low">가격 낮은순</option>
                  <option value="price-high">가격 높은순</option>
                  <option value="name">이름순</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-neutral-200 text-neutral-400">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="mt-8 text-xl font-semibold text-neutral-900">
              {error ? "오류로 인해 제품을 불러오지 못했습니다" : "현재 준비 중인 제품이 없습니다"}
            </h3>
            <p className="mt-3 text-sm text-neutral-500">
              {error ? "Firebase 설정을 확인한 후 다시 시도해 주세요." : "새로운 컬렉션이 곧 업데이트될 예정이에요."}
            </p>
            {user && user.email === "admin@rhythm.com" && (
              <Link
                href="/admin/add-product"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                첫 번째 제품 추가하기
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/order/${product.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lifted transition duration-500 ease-soft hover:-translate-y-2 hover:border-primary-200/80 hover:shadow-glow"
              >
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-200/30 via-secondary-200/20 to-white" />
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="relative z-10 h-44 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative z-10 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 via-white to-neutral-50 text-neutral-300">
                      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 z-20 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-primary-600 shadow">
                    {categoryLabels[product.category || "all"] ?? "기타"}
                  </div>
                  <div className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-inner shadow-white/60">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">#{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="line-clamp-2 text-lg font-semibold text-neutral-900 transition group-hover:text-primary-600">
                      {product.name}
                    </h3>
                    <p className="line-clamp-2 text-sm text-neutral-500">{product.description}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-neutral-900">₩{product.price.toLocaleString()}</span>
                    <span className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white transition group-hover:bg-neutral-800">
                      자세히 보기
                    </span>
                  </div>

                  {(product.colors?.length ?? 0) > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-neutral-500">추천 색상</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors!.slice(0, 3).map((color) => (
                          <span
                            key={color}
                            className="rounded-full border border-white/50 bg-primary-100/40 px-3 py-1 text-xs font-medium text-primary-700"
                          >
                            {color}
                          </span>
                        ))}
                        {product.colors!.length > 3 && (
                          <span className="rounded-full border border-dashed border-neutral-200 px-3 py-1 text-xs text-neutral-400">
                            +{product.colors!.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(product.sizes?.length ?? 0) > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-neutral-500">사이즈 옵션</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes!.slice(0, 4).map((size) => (
                          <span
                            key={size}
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600"
                          >
                            {size}
                          </span>
                        ))}
                        {product.sizes!.length > 4 && (
                          <span className="rounded-full border border-dashed border-neutral-200 px-3 py-1 text-xs text-neutral-400">
                            +{product.sizes!.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
