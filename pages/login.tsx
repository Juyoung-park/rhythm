import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // 전화번호 정규화 함수 (숫자만 추출)
  const normalizePhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, "");
  };

  // 이름과 전화번호로 기존 회원 검색
  const searchExistingUsers = async () => {
    if (!registrationForm.name.trim() || !registrationForm.phone.trim()) {
      return [];
    }

    try {
      const normalizedInputPhone = normalizePhone(registrationForm.phone);
      const inputName = registrationForm.name.trim();
      
      console.log(`검색 시작: 이름 "${inputName}", 전화번호 "${normalizedInputPhone}"`);
      
      // 모든 사용자를 가져와서 클라이언트에서 필터링 (더 정확한 검색을 위해)
      const usersRef = collection(db, "users");
      const allUsersSnapshot = await getDocs(usersRef);
      
      const foundUsers: any[] = [];
      
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`검색 중인 사용자: ID=${doc.id}, 이름="${userData.name}", 전화번호="${userData.phone}"`);
        
        // 이름과 전화번호 모두 정확히 일치하는지 확인
        if (userData.name === inputName && userData.phone) {
          const normalizedStoredPhone = normalizePhone(userData.phone);
          console.log(`이름 일치! 전화번호 비교: 저장된="${normalizedStoredPhone}", 입력="${normalizedInputPhone}"`);
          if (normalizedStoredPhone === normalizedInputPhone) {
            foundUsers.push({
              id: doc.id,
              ...userData
            });
            console.log(`✅ 일치하는 사용자 발견: ID=${doc.id}, 이름=${userData.name}, 전화번호=${userData.phone} (정규화: ${normalizedStoredPhone})`);
          } else {
            console.log(`❌ 전화번호 불일치: ${normalizedStoredPhone} !== ${normalizedInputPhone}`);
          }
        } else {
          if (userData.name !== inputName) {
            console.log(`❌ 이름 불일치: "${userData.name}" !== "${inputName}"`);
          }
          if (!userData.phone) {
            console.log(`❌ 전화번호 없음`);
          }
        }
      });

      console.log(`최종 검색 결과: ${foundUsers.length}명 발견`);
      return foundUsers;
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      return [];
    }
  };



  const handleAuth = async () => {
    if (!email || !pw) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (isNew) {
      // 회원가입 시 필수 필드 검증 (이메일, 비밀번호는 이미 상단에서 검증됨)
      if (!email.trim()) {
        setError("이메일을 입력해주세요.");
        return;
      }
      if (!pw.trim()) {
        setError("비밀번호를 입력해주세요.");
        return;
      }
      if (!registrationForm.name.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
      if (!registrationForm.phone.trim()) {
        setError("연락처를 입력해주세요.");
        return;
      }

      // 기존 회원 정보 검색은 handleAuth 내부에서 처리
    }

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        console.log("=== 회원가입 시작 ===");
        console.log("입력된 정보:", {
          name: registrationForm.name.trim(),
          phone: registrationForm.phone.trim(),
          email: email
        });
        
        // 먼저 기존 회원 정보 검색
        const existingUsers = await searchExistingUsers();
        console.log("기존 회원 검색 결과:", existingUsers);
        
        // Firebase Authentication에 계정 생성 시도
        let newUser = null;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
          newUser = userCredential.user;
          console.log("Firebase Auth 계정 생성 완료:", newUser.uid);
        } catch (authError: any) {
          if (authError.code === "auth/email-already-in-use") {
            // 이메일이 이미 사용 중인 경우 - 기존 사용자와 연결 시도
            console.log("이메일이 이미 사용 중입니다. 기존 사용자와 연결을 시도합니다.");
            
            if (existingUsers && existingUsers.length > 0) {
              // 기존 Firestore 사용자와 연결
              const existingUser = existingUsers[0];
              console.log("기존 Firestore 사용자와 연결:", existingUser);
              
              // Firebase Auth로 로그인 시도
              try {
                await signInWithEmailAndPassword(auth, email, pw);
                console.log("기존 계정으로 로그인 성공");
                
                // Firebase Auth UID로 기존 사용자 정보를 새 문서에 저장
                const user = auth.currentUser;
                if (user) {
                  const updatedUserData = {
                    ...existingUser,
                    email: email,
                    // 회원가입 폼의 정보로 업데이트 (기존 정보 유지하면서 새 정보 추가)
                    carNumber: registrationForm.carNumber.trim() || existingUser.carNumber || "",
                    address: registrationForm.address.trim() || existingUser.address || "",
                    organization: registrationForm.organization.trim() || existingUser.organization || "",
                    updatedAt: new Date()
                  };
                  
                  // Firebase Auth UID로 새 문서 생성 (기존 정보 포함)
                  await setDoc(doc(db, "users", user.uid), updatedUserData);
                  console.log("Firebase Auth UID로 사용자 정보 저장 완료:", user.uid);
                  
                  // 기존 문서 삭제 (선택사항)
                  await deleteDoc(doc(db, "users", existingUser.id));
                  console.log("기존 문서 삭제 완료:", existingUser.id);
                }
                
                alert("기존 고객 정보와 연결되어 로그인 정보가 업데이트되었습니다!");
                
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
                
                router.push("/products");
              } catch (loginError) {
                console.error("기존 계정 로그인 실패:", loginError);
                alert("기존 계정과 연결되었지만 로그인에 실패했습니다. 비밀번호를 확인해주세요.");
              }
            } else {
              // 이메일은 사용 중이지만 Firestore에 사용자 정보가 없는 경우
              console.log("이메일은 사용 중이지만 Firestore에 사용자 정보가 없습니다.");
              alert("이 이메일은 이미 사용 중입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.");
              setError("이 이메일은 이미 사용 중입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.");
            }
            setLoading(false);
            return;
          } else {
            // 다른 인증 오류
            throw authError;
          }
        }
        
        // 새로운 계정이 성공적으로 생성된 경우
        if (newUser) {
          // Firestore에 사용자 정보 생성 또는 기존 사용자 정보 업데이트
          try {
            if (existingUsers && existingUsers.length > 0) {
              // 기존 사용자와 연결 - 첫 번째 일치하는 사용자와 연결
              const existingUser = existingUsers[0];
              console.log("기존 사용자와 연결:", existingUser);
              
              const updatedUserData = {
                ...existingUser,
                email: email,
                // 회원가입 폼의 정보로 업데이트 (기존 정보 유지하면서 새 정보 추가)
                carNumber: registrationForm.carNumber.trim() || existingUser.carNumber || "",
                address: registrationForm.address.trim() || existingUser.address || "",
                organization: registrationForm.organization.trim() || existingUser.organization || "",
                updatedAt: new Date()
              };
              
              await setDoc(doc(db, "users", existingUser.id), updatedUserData);
              console.log("기존 사용자 정보 업데이트 완료:", existingUser.id);
              alert("기존 고객 정보와 연결되어 회원가입이 완료되었습니다!");
            } else {
              // 새로운 사용자 생성
              const newUserData = {
                email: email,
                name: registrationForm.name.trim(),
                phone: registrationForm.phone.trim(),
                carNumber: registrationForm.carNumber.trim() || "",
                address: registrationForm.address.trim() || "",
                organization: registrationForm.organization.trim() || "",
                height: "",
                bust: "",
                waist: "",
                hip: "",
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              await setDoc(doc(db, "users", newUser.uid), newUserData);
              console.log("새로운 사용자 정보 생성 완료:", newUser.uid, newUserData);
              alert("회원가입이 완료되었습니다!");
            }
            console.log("=== 회원가입 완료 ===");
          } catch (firestoreError) {
            console.error("Firestore 사용자 정보 생성 실패:", firestoreError);
            // Firestore 실패해도 회원가입은 성공으로 처리
          }
        }
        
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
        
        router.push("/products");
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
          router.push("/products");
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

  const highlights = [
    {
      title: "맞춤형 컨설팅",
      description: "스타일리스트와 함께 공연 컨셉에 맞춘 룩을 제안받으세요.",
      icon: "🪩",
    },
    {
      title: "실시간 주문 현황",
      description: "주문과 제작 상태를 한눈에 확인하고 팀과 공유할 수 있어요.",
      icon: "📊",
    },
    {
      title: "전문 피팅 케어",
      description: "피팅 일정부터 수정 요청까지 앱에서 손쉽게 관리하세요.",
      icon: "🧵",
    },
  ];

  const modeCopy = isNew
    ? {
        title: "Welcome to Rhythm",
        subtitle: "공연을 빛내는 댄스웨어 커뮤니티에 합류하세요.",
        cta: "회원가입",
        switchLabel: "이미 계정이 있으신가요?",
        switchCta: "로그인",
      }
    : {
        title: "안녕하세요!",
        subtitle: "리듬의 다양한 맞춤 서비스를 이용해보세요.",
        cta: "로그인",
        switchLabel: "계정이 없으신가요?",
        switchCta: "회원가입",
      };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary-200/30 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-between rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-10 text-white shadow-2xl lg:flex">
            <div className="flex items-center justify-between text-sm uppercase tracking-[0.35em] text-white/60">
              <Link href="/" className="text-white/80 transition hover:text-white">
                Rhythm
              </Link>
              <span>Dance Wear Studio</span>
            </div>
            <div className="mt-12 space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary-200">Premium Custom</p>
              <h1 className="text-4xl font-semibold leading-tight">
                팀의 무드를 완성하는
                <br />
                <span className="text-secondary-200">맞춤형 댄스웨어 플랫폼</span>
              </h1>
              <p className="text-sm leading-relaxed text-white/70">
                Rhythm과 함께라면 상담 예약, 주문, 제작 관리까지 한 번에 진행할 수 있어요. 로그인하고 팀 전용 대시보드를 확인해보세요.
              </p>
            </div>
            <div className="mt-10 space-y-4">
              {highlights.map((item) => (
                <div key={item.title} className="group flex items-start gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/70">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between text-xs text-white/50">
              <p>© {new Date().getFullYear()} Rhythm Dance Wear</p>
              <Link href="/products" className="underline-offset-4 transition hover:text-white hover:underline">
                제품 둘러보기
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 md:p-10">
            <div className="mb-10 space-y-3 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary-600">
                Rhythm Access
              </div>
              <h2 className="text-3xl font-semibold text-neutral-900">{modeCopy.title}</h2>
              <p className="text-sm text-neutral-600">{modeCopy.subtitle}</p>
            </div>

            {error && (
              <div className="mb-8 rounded-2xl border border-red-200/70 bg-red-50/80 p-4">
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
                  <div className="space-y-2 text-sm text-red-600">
                    <p className="font-semibold">로그인에 실패했습니다.</p>
                    <p>{error}</p>
                    {error.includes("Firebase") && (
                      <Link href="/firebase-test" className="inline-flex items-center gap-2 text-xs font-semibold text-red-500">
                        Firebase 연결 테스트하기
                        <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                handleAuth();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="이메일을 입력하세요"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={pw}
                  onChange={(event) => setPw(event.target.value)}
                />
              </div>

              {isNew && (
                <div className="space-y-5 rounded-3xl border border-white/50 bg-white/70 p-5">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">추가 정보</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      이메일과 비밀번호는 필수 항목입니다. 아래 정보도 함께 입력해주세요.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-neutral-700">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="이름을 입력하세요"
                        className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={registrationForm.name}
                        onChange={(event) => handleRegistrationFormChange("name", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-neutral-700">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
                        className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={registrationForm.phone}
                        onChange={(event) => handleRegistrationFormChange("phone", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="carNumber" className="text-sm font-medium text-neutral-700">
                        차량번호 <span className="text-neutral-400 text-xs">(선택)</span>
                      </label>
                      <input
                        id="carNumber"
                        type="text"
                        placeholder="차량번호를 입력하세요"
                        className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={registrationForm.carNumber}
                        onChange={(event) => handleRegistrationFormChange("carNumber", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium text-neutral-700">
                        주소 <span className="text-neutral-400 text-xs">(선택)</span>
                      </label>
                      <input
                        id="address"
                        type="text"
                        placeholder="주소를 입력하세요"
                        className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={registrationForm.address}
                        onChange={(event) => handleRegistrationFormChange("address", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="organization" className="text-sm font-medium text-neutral-700">
                        소속 <span className="text-neutral-400 text-xs">(선택)</span>
                      </label>
                      <input
                        id="organization"
                        type="text"
                        placeholder="소속을 입력하세요"
                        className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-inner shadow-white/40 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={registrationForm.organization}
                        onChange={(event) => handleRegistrationFormChange("organization", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition duration-500 ease-soft hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : modeCopy.cta}
              </button>
            </form>

            <div className="mt-10 flex flex-col gap-4 text-center text-sm text-neutral-500">
              <div>
                <span>{modeCopy.switchLabel} </span>
                <button
                  onClick={() => {
                    setIsNew(!isNew);
                    resetForms();
                  }}
                  className="font-semibold text-primary-600 underline-offset-4 transition hover:text-primary-700 hover:underline"
                >
                  {modeCopy.switchCta}
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs">
                <Link href="/products" className="text-neutral-500 transition hover:text-primary-600">
                  제품 둘러보기
                </Link>
                <span className="text-neutral-300">•</span>
                <Link href="/firebase-status" className="text-neutral-500 transition hover:text-primary-600">
                  시스템 상태
                </Link>
              </div>
            </div>

            {!isNew && (
              <div className="mt-8 rounded-2xl border border-primary-100 bg-primary-50/70 p-5 text-left text-sm text-primary-700">
                <p className="font-semibold text-primary-800">관리자 체험 계정</p>
                <p className="mt-2 leading-relaxed">
                  이메일: <span className="font-medium">admin@rhythm.com</span>
                  <br />비밀번호: <span className="font-medium">admin123</span>
                </p>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-yellow-200/70 bg-yellow-50/80 p-5 text-left text-sm text-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-900">Firebase 설정이 필요하신가요?</h3>
              <ul className="mt-3 space-y-1 text-xs text-yellow-700">
                <li>1. <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline">Firebase Console</a> 방문</li>
                <li>2. 프로젝트 `rhythmdancewear-a88d4` 선택</li>
                <li>3. Firestore Database 생성 (테스트 모드)</li>
                <li>4. Authentication → Email/Password 활성화</li>
                <li>5. <Link href="/firebase-test" className="underline">Firebase 테스트</Link> 실행</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
