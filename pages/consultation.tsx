import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/UserContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

interface ConsultationForm {
  name: string;
  email: string;
  phone: string;
  teamName: string;
  consultationType: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  budget: string;
  performanceDate: string;
}

export default function Consultation() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ConsultationForm>({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    teamName: "",
    consultationType: "상담",
    preferredDate: "",
    preferredTime: "",
    message: "",
    budget: "",
    performanceDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const consultationData = {
        ...form,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "consultations"), consultationData);
      
      alert("상담 문의가 성공적으로 전송되었습니다!\n빠른 시일 내에 연락드리겠습니다.");
      router.push("/products");
    } catch (error) {
      console.error("Error submitting consultation:", error);
      alert("상담 문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              <p className="text-sm font-semibold text-neutral-900">상담 문의</p>
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
              Custom Consultation
            </span>
            <h1 className="mt-6 text-4xl font-semibold text-neutral-900 sm:text-5xl">
              맞춤 제작 상담 문의
            </h1>
            <p className="mt-4 text-base text-neutral-600 sm:text-lg">
              팀의 비전을 담은 완벽한 댄스웨어를 위해 전문가와 상담해보세요.
            </p>
          </div>

          {/* Form */}
          <div className="glass-panel rounded-3xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-neutral-900">기본 정보</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                      placeholder="이름을 입력해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                      placeholder="이메일을 입력해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                      placeholder="연락처를 입력해주세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      팀명/그룹명
                    </label>
                    <input
                      type="text"
                      name="teamName"
                      value={form.teamName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                      placeholder="팀명 또는 그룹명을 입력해주세요"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-neutral-900">상담 정보</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상담 유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="consultationType"
                      value={form.consultationType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    >
                      <option value="상담">일반 상담</option>
                      <option value="맞춤제작">맞춤 제작 문의</option>
                      <option value="견적">견적 요청</option>
                      <option value="기타">기타 문의</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예상 예산
                    </label>
                    <select
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    >
                      <option value="">선택해주세요</option>
                      <option value="50만원 이하">50만원 이하</option>
                      <option value="50만원 - 100만원">50만원 - 100만원</option>
                      <option value="100만원 - 200만원">100만원 - 200만원</option>
                      <option value="200만원 - 300만원">200만원 - 300만원</option>
                      <option value="300만원 이상">300만원 이상</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      공연 예정일
                    </label>
                    <input
                      type="date"
                      name="performanceDate"
                      value={form.performanceDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      선호 상담 날짜
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={form.preferredDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-neutral-900">상세 메시지</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-none"
                    placeholder="팀의 콘셉트, 원하는 스타일, 특별한 요청사항 등을 자세히 적어주세요."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-4 bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 text-white font-semibold rounded-xl shadow-lg transition duration-500 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(147,51,234,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "전송 중..." : "상담 문의 보내기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
