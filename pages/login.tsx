import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    phone: "",
    carNumber: "",
    address: "",
    organization: "",
  });
  const router = useRouter();

  const handleRegistrationFormChange = (field: string, value: string) => {
    setRegistrationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForms = () => {
    setEmail("");
    setPw("");
    setError(null);
    setRegistrationForm({
      name: "",
      phone: "",
      carNumber: "",
      address: "",
      organization: "",
    });
  };

  const handleAuth = async () => {
    if (!email || !pw) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (isNew) {
      // 회원가입 시 필수 필드 검증
      if (!registrationForm.name.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
      if (!registrationForm.phone.trim()) {
        setError("연락처를 입력해주세요.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        // Firebase Authentication에 계정 생성
        const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
        const newUser = userCredential.user;
        
        // Firestore에 사용자 정보 생성 (관리자 페이지에서 보이도록)
        try {
          await setDoc(doc(db, "users", newUser.uid), {
            email: email,
            name: registrationForm.name.trim(),
            phone: registrationForm.phone.trim(),
            carNumber: registrationForm.carNumber.trim(),
            address: registrationForm.address.trim(),
            organization: registrationForm.organization.trim(),
            height: "",
            bust: "",
            waist: "",
            hip: "",
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log("Firestore에 사용자 정보 생성 완료");
        } catch (firestoreError) {
          console.error("Firestore 사용자 정보 생성 실패:", firestoreError);
          // Firestore 실패해도 회원가입은 성공으로 처리
        }
        
        alert("회원가입 완료!");
        
        // 인증 상태 변경을 기다린 후 라우팅
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve();
            }
          });
          // 최대 3초 대기
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 3000);
        });
        
        router.push("/my-info");
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
        alert("로그인 성공!");
        
        // 인증 상태 변경을 기다린 후 라우팅
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve();
            }
          });
          // 최대 3초 대기
          setTimeout(() => {
            unsubscribe();
            resolve();
          }, 3000);
        });
        
        if (email === "admin@rhythm.com") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let errorMessage = "에러 발생!";
      
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해보세요.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "잘못된 비밀번호입니다.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "비밀번호는 6자 이상이어야 합니다.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "네트워크 연결을 확인해주세요.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "올바른 이메일 형식이 아닙니다.";
      } else if (err.message && err.message.includes("permission")) {
        errorMessage = "Firebase 권한 오류입니다. Firebase Console 설정을 확인해주세요.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Rhythm</Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isNew ? "회원가입" : "로그인"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isNew ? "새로운 계정을 만들어주세요" : "계정에 로그인해주세요"}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                    {error.includes("Firebase") && (
                      <div className="mt-2">
                        <Link href="/firebase-test" className="text-red-800 underline">
                          Firebase 연결 테스트하기
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="비밀번호를 입력하세요"
                value={pw}
                onChange={e => setPw(e.target.value)}
              />
            </div>

            {/* 회원가입 시에만 표시되는 추가 필드들 */}
            {isNew && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="이름을 입력하세요"
                    value={registrationForm.name}
                    onChange={e => handleRegistrationFormChange("name", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
                    value={registrationForm.phone}
                    onChange={e => handleRegistrationFormChange("phone", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="carNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    차량번호
                  </label>
                  <input
                    id="carNumber"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="차량번호를 입력하세요 (선택사항)"
                    value={registrationForm.carNumber}
                    onChange={e => handleRegistrationFormChange("carNumber", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    id="address"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="주소를 입력하세요 (선택사항)"
                    value={registrationForm.address}
                    onChange={e => handleRegistrationFormChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    소속
                  </label>
                  <input
                    id="organization"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="소속을 입력하세요 (선택사항)"
                    value={registrationForm.organization}
                    onChange={e => handleRegistrationFormChange("organization", e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? "처리 중..." : (isNew ? "회원가입" : "로그인")}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsNew(!isNew);
                resetForms();
              }}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {isNew ? "이미 계정이 있으신가요? 로그인하기" : "계정이 없으신가요? 회원가입하기"}
            </button>
          </div>

          {!isNew && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>관리자 계정:</strong><br />
                이메일: admin@rhythm.com<br />
                비밀번호: admin123
              </p>
            </div>
          )}

          {/* Firebase Setup Help */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Firebase 설정이 안 되었나요?</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>1. <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a> 방문</div>
              <div>2. 프로젝트 `rhythmdancewear-a88d4` 선택</div>
              <div>3. Firestore Database 생성 (테스트 모드)</div>
              <div>4. Authentication → Email/Password 활성화</div>
              <div>5. <Link href="/firebase-test" className="underline">Firebase 테스트</Link> 실행</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
