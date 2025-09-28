import Link from "next/link";
import { useAuth } from "../context/UserContext";

export default function BodyMeasurements() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary-200/40 via-transparent to-transparent" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/products" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
              💃
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Rhythm</p>
              <p className="text-sm font-semibold text-neutral-900">신체 사이즈 측정법</p>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link href="/products" className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block">
              홈
            </Link>
            <Link href="/products" className="hidden rounded-full px-4 py-2 transition hover:bg-neutral-900 hover:text-white md:block">
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
                  <div className="relative mx-auto w-80 h-96">
                    {/* SVG 상체 도식도 - 실제 인체 비율 반영 */}
                    <svg viewBox="0 0 300 400" className="w-full h-full">
                      {/* 머리 */}
                      <circle cx="150" cy="40" r="25" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 목 */}
                      <ellipse cx="150" cy="70" rx="12" ry="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      
                      {/* 어깨선 */}
                      <path d="M120 85 L180 85 L175 95 L125 95 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 상체 (가슴 부분) */}
                      <ellipse cx="150" cy="140" rx="45" ry="35" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 허리 */}
                      <ellipse cx="150" cy="190" rx="35" ry="25" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 팔 (왼쪽) */}
                      <ellipse cx="105" cy="120" rx="15" ry="50" fill="#fef3c7" stroke="#d97706" strokeWidth="2" transform="rotate(-20 105 120)"/>
                      
                      {/* 팔 (오른쪽) */}
                      <ellipse cx="195" cy="120" rx="15" ry="50" fill="#fef3c7" stroke="#d97706" strokeWidth="2" transform="rotate(20 195 120)"/>
                      
                      {/* 손목 (왼쪽) */}
                      <circle cx="95" cy="165" r="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      
                      {/* 손목 (오른쪽) */}
                      <circle cx="205" cy="165" r="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      
                      {/* 어깨너비 (1) */}
                      <line x1="125" y1="90" x2="175" y2="90" stroke="#dc2626" strokeWidth="4"/>
                      <circle cx="150" y="90" r="3" fill="#dc2626"/>
                      <text x="150" y="85" textAnchor="middle" className="text-sm font-bold fill-red-600">1</text>
                      
                      {/* 가슴둘레 (2) */}
                      <ellipse cx="150" cy="140" rx="42" ry="30" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="8,4"/>
                      <circle cx="192" cy="140" r="3" fill="#2563eb"/>
                      <text x="200" y="145" textAnchor="middle" className="text-sm font-bold fill-blue-600">2</text>
                      
                      {/* 허리둘레 (3) */}
                      <ellipse cx="150" cy="190" rx="32" ry="20" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="8,4"/>
                      <circle cx="182" cy="190" r="3" fill="#16a34a"/>
                      <text x="190" y="195" textAnchor="middle" className="text-sm font-bold fill-green-600">3</text>
                      
                      {/* 소매길이 (4) */}
                      <line x1="125" y1="95" x2="95" y2="165" stroke="#ea580c" strokeWidth="4"/>
                      <circle cx="110" cy="130" r="3" fill="#ea580c"/>
                      <text x="100" y="135" textAnchor="middle" className="text-sm font-bold fill-orange-600">4</text>
                      
                      {/* 상의길이 (5) */}
                      <line x1="150" y1="85" x2="150" y2="220" stroke="#9333ea" strokeWidth="4"/>
                      <circle cx="150" y="152" r="3" fill="#9333ea"/>
                      <text x="160" y="157" textAnchor="middle" className="text-sm font-bold fill-purple-600">5</text>
                      
                      {/* 측정 가이드 라인 */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
                        </marker>
                      </defs>
                    </svg>
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
                  <div className="relative mx-auto w-80 h-96">
                    {/* SVG 하체 도식도 - 실제 인체 비율 반영 */}
                    <svg viewBox="0 0 300 400" className="w-full h-full">
                      {/* 상체 부분 (허리까지) */}
                      <ellipse cx="150" cy="80" rx="35" ry="25" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 엉덩이 (더 넓고 자연스러운 곡선) */}
                      <path d="M115 100 Q150 85 185 100 Q190 130 185 160 Q150 175 115 160 Q110 130 115 100" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 허벌지 (자연스러운 곡선) */}
                      <path d="M130 160 Q150 140 170 160 Q175 200 170 240 Q150 220 130 240 Q125 200 130 160" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 왼쪽 다리 */}
                      <ellipse cx="135" cy="320" rx="18" ry="60" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 오른쪽 다리 */}
                      <ellipse cx="165" cy="320" rx="18" ry="60" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
                      
                      {/* 무릎 */}
                      <circle cx="135" cy="280" r="12" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      <circle cx="165" cy="280" r="12" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      
                      {/* 발목 */}
                      <ellipse cx="135" cy="375" rx="10" ry="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      <ellipse cx="165" cy="375" rx="10" ry="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                      
                      {/* 엉덩이둘레 (6) */}
                      <path d="M115 100 Q150 85 185 100 Q190 130 185 160 Q150 175 115 160 Q110 130 115 100" fill="none" stroke="#ec4899" strokeWidth="4" strokeDasharray="8,4"/>
                      <circle cx="190" cy="130" r="3" fill="#ec4899"/>
                      <text x="200" y="135" textAnchor="middle" className="text-sm font-bold fill-pink-600">6</text>
                      
                      {/* 허벌지둘레 (7) */}
                      <path d="M130 160 Q150 140 170 160 Q175 200 170 240 Q150 220 130 240 Q125 200 130 160" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="8,4"/>
                      <circle cx="175" cy="200" r="3" fill="#eab308"/>
                      <text x="185" y="205" textAnchor="middle" className="text-sm font-bold fill-yellow-600">7</text>
                      
                      {/* 밑위길이 (8) */}
                      <line x1="150" y1="100" x2="150" y2="170" stroke="#6366f1" strokeWidth="4"/>
                      <circle cx="150" y="135" r="3" fill="#6366f1"/>
                      <text x="160" y="140" textAnchor="middle" className="text-sm font-bold fill-indigo-600">8</text>
                      
                      {/* 바지길이 (9) */}
                      <line x1="150" y1="100" x2="150" y2="390" stroke="#14b8a6" strokeWidth="4"/>
                      <circle cx="150" y="245" r="3" fill="#14b8a6"/>
                      <text x="160" y="250" textAnchor="middle" className="text-sm font-bold fill-teal-600">9</text>
                      
                      {/* 치마길이 (10) */}
                      <line x1="150" y1="100" x2="150" y2="200" stroke="#f43f5e" strokeWidth="4"/>
                      <circle cx="150" y="150" r="3" fill="#f43f5e"/>
                      <text x="160" y="155" textAnchor="middle" className="text-sm font-bold fill-rose-600">10</text>
                    </svg>
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
