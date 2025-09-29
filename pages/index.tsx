import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useAuth } from "../context/UserContext"

const highlights = [
  {
    title: "맞춤 제작",
    description: "체형과 동선을 고려한 맞춤 패턴으로 무대 위 완벽한 실루엣을 완성해요.",
    icon: "✨",
  },
  {
    title: "프리미엄 소재",
    description: "움직임에 따라 반짝이는 하이퀄리티 원단과 오랜 착용에도 편안한 라이닝.",
    icon: "🪩",
  },
  {
    title: "스타일 컨설팅",
    description: "댄스 스타일리스트와 함께 공연 분위기에 맞춘 컨셉을 제안받으세요.",
    icon: "🎨",
  },
]

const steps = [
  {
    title: "01. 상담 예약",
    description: "전화 또는 온라인 폼으로 간편하게 상담을 신청해요.",
  },
  {
    title: "02. 스타일 제안",
    description: "체형, 팀 콘셉트, 음악 템포에 맞춘 디자인을 추천해요.",
  },
  {
    title: "03. 핏 체크",
    description: "샘플 피팅과 수정 과정을 거쳐 완벽한 핏을 완성해요.",
  },
  {
    title: "04. 무대 데뷔",
    description: "마지막 디테일까지 함께 점검하고 공연에 집중하세요.",
  },
]

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // 로딩 중이 아니고 사용자가 로그인되어 있으면 제품 보기 페이지로 리다이렉트
    if (!loading && user) {
      setIsRedirecting(true)
      router.push('/products')
    }
  }, [user, loading, router])

  // 로그인된 사용자는 리다이렉트 중이므로 로딩 표시
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-gray-600">
            {loading ? "로그인 상태를 확인하는 중..." : "제품 페이지로 이동하는 중..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary-200/40 via-transparent to-transparent" />
      <div className="relative z-10 px-6 py-12 md:px-10 lg:px-20">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-neutral-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-glow backdrop-blur">
              <img 
                src="/rhythm-logo.svg" 
                alt="Rhythm 로고" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">Dance Wear</p>
              <h1 className="text-xl font-semibold text-gradient">Rhythm</h1>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <Link href="/products" className="hover:text-primary-600 transition-colors">제품 보기</Link>
            <Link href="/body-measurements" className="hover:text-primary-600 transition-colors">사이즈 가이드</Link>
            {user ? (
              <>
                <Link href="/my-info" className="hover:text-primary-600 transition-colors">내 정보</Link>
                <span className="text-sm text-gray-500">안녕하세요, {user.email}님</span>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-neutral-900/10 transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                로그인
              </Link>
            )}
          </div>
        </header>

        <main className="mt-16 flex flex-col gap-24">
          <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-4 py-2 backdrop-blur-xl shadow-glow">
                <span className="h-2 w-2 rounded-full bg-secondary-500" />
                <span className="text-sm font-medium text-neutral-600">라인댄스 전문 의상 아틀리에</span>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-heading tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                  <span className="text-gradient">무대 위 리듬</span>을 완성하는
                  <br className="hidden md:inline" /> 맞춤형 댄스웨어
                </h2>
                <p className="max-w-xl text-lg text-neutral-600">
                  Rhythm의 디자이너와 장인이 함께 만드는 하이앤드 공연 의상. 팀의 개성과 퍼포먼스를 극대화하는 디자인을 경험해 보세요.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/products"
                  className="rounded-full bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 px-8 py-3 text-base font-semibold text-white shadow-glow transition duration-500 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(147,51,234,0.6)]"
                >
                  제품 살펴보기
                </Link>
                <Link
                  href="/body-measurements"
                  className="rounded-full border border-neutral-200/80 bg-white/70 px-8 py-3 text-base font-semibold text-neutral-700 backdrop-blur transition duration-500 ease-soft hover:-translate-y-1 hover:border-primary-200 hover:text-primary-700"
                >
                  사이즈 가이드
                </Link>
                <Link
                  href={user ? "/consultation" : "/login"}
                  className="rounded-full border border-neutral-200/80 bg-white/70 px-8 py-3 text-base font-semibold text-neutral-700 backdrop-blur transition duration-500 ease-soft hover:-translate-y-1 hover:border-primary-200 hover:text-primary-700"
                >
                  맞춤 제작 문의
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-200 to-secondary-200 shadow-inner shadow-white/40 ring-2 ring-white"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-neutral-600">500+ 팀이 Rhythm을 선택했어요</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary-200/50 via-secondary-200/30 to-white blur-3xl" />
              <div className="glass-panel rounded-3xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.25em] text-neutral-500">Next Showcase</span>
                    <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-600">New</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-neutral-900">Astra Dance Crew</h3>
                    <p className="text-sm text-neutral-500">서울 댄스 페스티벌 2025</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "컨셉", value: "Neo Disco" },
                      { label: "멤버", value: "12명" },
                      { label: "완성도", value: "92%" },
                    ].map((item) => (
                      <div key={item.label} className="floating-card p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-white/80 p-6 shadow-inner shadow-white/40">
                    <p className="text-sm text-neutral-600">
                      &ldquo;움직임 하나하나가 빛나도록 구성된 패턴과 비딩 디테일이 공연 내내 관객의 시선을 사로잡았어요.&rdquo;
                    </p>
                    <p className="mt-4 text-sm font-semibold text-neutral-900">- Rhythm 디자이너 팀</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-secondary-500">WHY RHYTHM</p>
                <h3 className="mt-3 text-3xl font-semibold text-neutral-900 md:text-4xl">퍼포먼스를 완성하는 디테일</h3>
              </div>
              <Link href="/products" className="hidden text-sm font-semibold text-primary-600 md:inline-flex md:items-center md:gap-2">
                전체 제품 보기
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="floating-card h-full space-y-4 p-6">
                  <span className="text-4xl">{highlight.icon}</span>
                  <h4 className="text-xl font-semibold text-neutral-900">{highlight.title}</h4>
                  <p className="text-sm leading-relaxed text-neutral-600">{highlight.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary-600">
                    자세히 알아보기
                    <span aria-hidden>→</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-3xl p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-600">PROCESS</p>
                <h3 className="text-3xl font-semibold text-neutral-900 md:text-4xl">Rhythm과 함께하는 제작 여정</h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  상담부터 피팅, 납품까지 전 과정을 전문가가 동행해요. 일정 관리와 스타일 컨설팅까지 한 번에 해결하세요.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {steps.map((step) => (
                  <div key={step.title} className="floating-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">{step.title}</p>
                    <p className="mt-3 text-sm text-neutral-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-100/70 bg-white/80 p-10 text-center shadow-glow backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-neutral-500">Ready to shine</p>
            <h3 className="mt-4 text-3xl font-semibold text-neutral-900 md:text-4xl">팀의 시그니처 무드를 만들어 볼까요?</h3>
            <p className="mt-4 text-base text-neutral-600 md:text-lg">
              Rhythm 컨설턴트와의 30분 스타일링 세션으로 첫 경험을 시작해 보세요.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/products"
                className="rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-800"
              >
                포트폴리오 보기
              </Link>
              <Link
                href={user ? "/consultation" : "/login"}
                className="rounded-full border border-neutral-200/80 bg-white px-8 py-3 text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:border-secondary-200 hover:text-secondary-600"
              >
                상담 예약하기
              </Link>
            </div>
          </section>
        </main>

        <footer className="mt-24 border-t border-white/40 pt-10 text-sm text-neutral-500">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Rhythm Dance Wear. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/products" className="hover:text-primary-600 transition-colors">제품</Link>
              <Link href={user ? "/consultation" : "/login"} className="hover:text-primary-600 transition-colors">
                상담 문의
              </Link>
              <Link href="/admin" className="hover:text-primary-600 transition-colors">관리자</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
