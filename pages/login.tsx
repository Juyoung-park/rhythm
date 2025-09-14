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
                  <p className="text-sm text-gray-600 mb-4">이메일과 비밀번호는 필수 항목입니다. 아래 정보도 함께 입력해주세요.</p>
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
                    차량번호 <span className="text-gray-400 text-xs">(선택사항)</span>
                  </label>
                  <input
                    id="carNumber"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="차량번호를 입력하세요"
                    value={registrationForm.carNumber}
                    onChange={e => handleRegistrationFormChange("carNumber", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    주소 <span className="text-gray-400 text-xs">(선택사항)</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="주소를 입력하세요"
                    value={registrationForm.address}
                    onChange={e => handleRegistrationFormChange("address", e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    소속 <span className="text-gray-400 text-xs">(선택사항)</span>
                  </label>
                  <input
                    id="organization"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="소속을 입력하세요"
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
                {loading ? "처리 중..." : isNew ? "회원가입" : "로그인"}
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
