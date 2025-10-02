import Link from "next/link";
import { useAuth } from "../context/UserContext";

type MarkerId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface MeasurementSilhouetteProps {
  emphasize?: MarkerId[];
  className?: string;
}

const MeasurementSilhouette = ({ emphasize = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], className }: MeasurementSilhouetteProps) => {
  const isActive = (id: MarkerId) => emphasize.includes(id);

  return (
    <svg
      viewBox="0 0 320 560"
      role="img"
      aria-labelledby="measurement-figure-title measurement-figure-desc"
      className={className}
    >
      <title id="measurement-figure-title">신체 사이즈 측정용 실루엣</title>
      <desc id="measurement-figure-desc">
        어깨, 가슴, 허리, 소매, 상의, 엉덩이, 허벌지, 밑위, 바지, 치마 측정 위치가 표시된 사람 실루엣 그래픽
      </desc>
      <defs>
        <linearGradient id="silhouette-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="50%" stopColor="#111827" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="limb-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#0b1220" />
        </linearGradient>
        <radialGradient id="silhouette-highlight" cx="50%" cy="28%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="300" rx="150" ry="235" fill="url(#silhouette-highlight)" />
      <circle cx="160" cy="70" r="42" fill="url(#silhouette-gradient)" stroke="#0b1220" strokeWidth="3" />
      <path
        d="M160 120c-28 0-42 26-42 56 0 12 4 26 4 38 0 16-16 24-24 40-8 16-10 36-10 52 0 32 14 64 14 88 0 20-10 58-14 96-3 28 6 56 6 82h112c0-26 9-54 6-82-4-38-14-76-14-96 0-24 14-56 14-88 0-16-2-36-10-52-8-16-24-24-24-40 0-12 4-26 4-38 0-30-14-56-42-56z"
        fill="url(#silhouette-gradient)"
        stroke="#0b1220"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M112 190c-12-18-26-30-42-34-10-2-20 4-22 14-2 8 2 16 6 24l30 66c4 8 6 18 6 28v18h36l-12-68c-2-12-8-24-12-34z"
        fill="url(#limb-gradient)"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M208 190c12-18 26-30 42-34 10-2 20 4 22 14 2 8-2 16-6 24l-30 66c-4 8-6 18-6 28v18h-36l12-68c2-12 8-24 12-34z"
        fill="url(#limb-gradient)"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M132 366c-18 4-28 22-26 42l16 124h52l-12-122c-2-16-12-32-30-44z"
        fill="url(#limb-gradient)"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M188 366c18 4 28 22 26 42l-16 124h-52l12-122c2-16 12-32 30-44z"
        fill="url(#limb-gradient)"
        stroke="#0b1220"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M94 530h62l-6 20H82z" fill="#0f172a" opacity="0.85" />
      <path d="M164 530h62l-6 20h-68z" fill="#0f172a" opacity="0.85" />

      <g strokeLinecap="round" strokeLinejoin="round" fontFamily="'Noto Sans KR', sans-serif">
        <g opacity={isActive(1) ? 1 : 0.18}>
          <line x1="118" y1="170" x2="202" y2="170" stroke="#ef4444" strokeWidth="6" />
          <text x="160" y="158" textAnchor="middle" fontSize="18" fontWeight="700" fill="#ef4444">1</text>
        </g>
        <g opacity={isActive(2) ? 1 : 0.18}>
          <ellipse cx="160" cy="228" rx="66" ry="46" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="12 8" />
          <text x="234" y="234" textAnchor="middle" fontSize="18" fontWeight="700" fill="#2563eb">2</text>
        </g>
        <g opacity={isActive(3) ? 1 : 0.18}>
          <ellipse cx="160" cy="314" rx="48" ry="34" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="10 6" />
          <text x="216" y="320" textAnchor="middle" fontSize="18" fontWeight="700" fill="#16a34a">3</text>
        </g>
        <g opacity={isActive(4) ? 1 : 0.18}>
          <path d="M118 178L88 300" stroke="#f97316" strokeWidth="4" />
          <text x="96" y="236" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f97316">4</text>
        </g>
        <g opacity={isActive(5) ? 1 : 0.18}>
          <path d="M160 184v216" stroke="#a855f7" strokeWidth="4" strokeDasharray="14 8" />
          <text x="172" y="292" fontSize="18" fontWeight="700" fill="#a855f7">5</text>
        </g>
        <g opacity={isActive(6) ? 1 : 0.18}>
          <ellipse cx="160" cy="356" rx="58" ry="42" fill="none" stroke="#ec4899" strokeWidth="4" strokeDasharray="14 8" />
          <text x="230" y="360" textAnchor="middle" fontSize="18" fontWeight="700" fill="#ec4899">6</text>
        </g>
        <g opacity={isActive(7) ? 1 : 0.18}>
          <ellipse cx="160" cy="402" rx="48" ry="34" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="12 8" />
          <text x="214" y="408" textAnchor="middle" fontSize="18" fontWeight="700" fill="#eab308">7</text>
        </g>
        <g opacity={isActive(8) ? 1 : 0.18}>
          <path d="M160 260v108" stroke="#6366f1" strokeWidth="4" />
          <text x="172" y="320" fontSize="18" fontWeight="700" fill="#6366f1">8</text>
        </g>
        <g opacity={isActive(9) ? 1 : 0.18}>
          <path d="M160 260v250" stroke="#14b8a6" strokeWidth="4" strokeDasharray="16 10" />
          <text x="172" y="420" fontSize="18" fontWeight="700" fill="#14b8a6">9</text>
        </g>
        <g opacity={isActive(10) ? 1 : 0.18}>
          <path d="M160 260v94" stroke="#f43f5e" strokeWidth="4" />
          <text x="172" y="306" fontSize="18" fontWeight="700" fill="#f43f5e">10</text>
        </g>
      </g>
    </svg>
  );
};

export default function BodyMeasurements() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary-200/40 via-transparent to-transparent" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/products" className="flex min-w-0 items-center gap-3">
            <div className="flex items-center min-w-0">
              <img 
                src="/rhythm-logo.svg" 
                alt="Rhythm 로고" 
                className="h-6 sm:h-7 w-auto max-w-[160px] object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Rhythm</p>
              <p className="text-sm font-semibold text-neutral-900">신체 사이즈 측정법</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link 
              href="/products" 
              className={`hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block ${
                router.pathname === "/products" ? "bg-neutral-900 text-white" : ""
              }`}
            >
              홈
            </Link>
            <Link 
              href="/products" 
              className={`hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block ${
                router.pathname === "/products" ? "bg-neutral-900 text-white" : ""
              }`}
            >
              제품 보기
            </Link>
            {user && (
              <>
                <Link href="/my-info" className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block">
                  내 정보
                </Link>
                <span className="text-sm text-gray-500">안녕하세요, {user.email}님</span>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 px-6 py-12 md:px-10 lg:px-20">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary-600 backdrop-blur">
              Size Guide
            </span>
            <h1 className="mt-6 text-4xl font-semibold text-neutral-900 sm:text-5xl">
              정확한 신체 사이즈 측정법
            </h1>
            <p className="mt-4 text-base text-neutral-600 sm:text-lg">
              완벽한 핏을 위한 정확한 측정 방법을 안내해드립니다.
            </p>
          </div>

          {/* Measurement Guide */}
          <div className="space-y-12">
            {/* 측정 준비사항 */}
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">측정 준비사항</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900">필요한 도구</h3>
                  <ul className="space-y-2 text-neutral-600">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      부드러운 줄자 (cm 단위)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      거울
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      얇은 속옷 착용
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900">측정 시 주의사항</h3>
                  <ul className="space-y-2 text-neutral-600">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      자연스러운 자세 유지
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      줄자를 너무 꽉 잡거나 느슨하게 하지 않기
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      측정값은 소수점 첫째 자리까지 기록
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 상체 측정법 */}
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">상체 측정법</h2>
              
              {/* 상체 이미지 */}
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
                  <div className="relative mx-auto w-full max-w-xl">
                    <MeasurementSilhouette emphasize={[1, 2, 3, 4, 5]} className="h-auto w-full" />
                  </div>
                </div>
              </div>

              {/* 상체 측정 설명 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">어깨너비</h4>
                      <p className="text-sm text-neutral-600">좌우 어깨 끝점 사이의 직선 거리</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">가슴둘레</h4>
                      <p className="text-sm text-neutral-600">가장 돌출된 부분을 수평으로 측정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">허리둘레</h4>
                      <p className="text-sm text-neutral-600">허리의 가장 가는 부분을 측정</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">소매길이</h4>
                      <p className="text-sm text-neutral-600">어깨 끝에서 손목까지의 길이</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">상의길이</h4>
                      <p className="text-sm text-neutral-600">어깨 중앙에서 원하는 길이까지</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하체 측정법 */}
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">하체 측정법</h2>
              
              {/* 하체 이미지 */}
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8 text-center">
                  <div className="relative mx-auto w-full max-w-xl">
                    <MeasurementSilhouette emphasize={[6, 7, 8, 9, 10]} className="h-auto w-full" />
                  </div>
                </div>
              </div>

              {/* 하체 측정 설명 */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-bold">6</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">엉덩이둘레</h4>
                      <p className="text-sm text-neutral-600">엉덩이의 가장 돌출된 부분을 측정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">7</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">허벌지둘레</h4>
                      <p className="text-sm text-neutral-600">허벌지의 가장 굵은 부분을 측정</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">8</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">밑위길이</h4>
                      <p className="text-sm text-neutral-600">허리에서 가랑이까지의 길이</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold">9</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">바지길이</h4>
                      <p className="text-sm text-neutral-600">허리에서 발목까지의 길이</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-sm font-bold">10</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">치마길이</h4>
                      <p className="text-sm text-neutral-600">허리에서 원하는 길이까지</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 측정 팁 */}
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">측정 팁</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📏</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">정확한 측정</h4>
                      <p className="text-sm text-neutral-600">줄자를 피부에 가볍게 접촉시키고, 호흡을 자연스럽게 유지하며 측정하세요.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🪞</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">거울 활용</h4>
                      <p className="text-sm text-neutral-600">거울을 보며 측정하여 줄자가 수평을 유지하는지 확인하세요.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">기록하기</h4>
                      <p className="text-sm text-neutral-600">측정값을 즉시 기록하고, 여러 번 측정하여 정확한 값을 확인하세요.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <h4 className="font-medium text-neutral-900">시간대</h4>
                      <p className="text-sm text-neutral-600">몸이 가장 자연스러운 상태인 오전 시간대에 측정하는 것이 좋습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="text-center">
              <div className="space-y-4">
                <p className="text-lg text-neutral-700">측정이 완료되었다면 내 정보에 사이즈를 입력해보세요!</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {user ? (
                    <Link
                      href="/my-info"
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 text-white font-semibold rounded-xl shadow-lg transition duration-500 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(147,51,234,0.6)]"
                    >
                      내 정보에서 사이즈 입력하기
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 text-white font-semibold rounded-xl shadow-lg transition duration-500 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(147,51,234,0.6)]"
                    >
                      로그인하고 사이즈 입력하기
                    </Link>
                  )}
                  <Link
                    href="/products"
                    className="px-8 py-3 border border-neutral-200/80 bg-white/70 text-neutral-700 font-semibold rounded-xl backdrop-blur transition duration-500 ease-soft hover:-translate-y-1 hover:border-primary-200 hover:text-primary-700"
                  >
                    제품 보러가기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
