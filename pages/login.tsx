import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const [matchingUsers, setMatchingUsers] = useState<any[]>([]);
  const [showMatchingUsers, setShowMatchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isVerifyingUser, setIsVerifyingUser] = useState(false);
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
    setMatchingUsers([]);
    setShowMatchingUsers(false);
    setSelectedUser(null);
    setIsVerifyingUser(false);
  };

  // 이름과 전화번호로 기존 회원 검색
  const searchExistingUsers = async () => {
    if (!registrationForm.name.trim() || !registrationForm.phone.trim()) {
      setError("이름과 연락처를 입력해주세요.");
      return;
    }

    setIsVerifyingUser(true);
    setError(null);

    try {
      // 이름으로 검색
      const nameQuery = query(collection(db, "users"), where("name", "==", registrationForm.name.trim()));
      const nameSnapshot = await getDocs(nameQuery);
      
      const foundUsers: any[] = [];
      nameSnapshot.forEach(doc => {
        const userData = doc.data();
        // 전화번호도 일치하는지 확인 (부분 일치)
        if (userData.phone && userData.phone.includes(registrationForm.phone.replace(/-/g, ""))) {
          foundUsers.push({
            id: doc.id,
            ...userData
          });
        }
      });

      if (foundUsers.length > 0) {
        setMatchingUsers(foundUsers);
        setShowMatchingUsers(true);
      } else {
        setError("일치하는 회원 정보를 찾을 수 없습니다. 새로운 회원으로 가입을 진행하시겠습니까?");
        setShowMatchingUsers(false);
      }
    } catch (error) {
      console.error("사용자 검색 오류:", error);
      setError("회원 정보 검색 중 오류가 발생했습니다.");
    } finally {
      setIsVerifyingUser(false);
    }
  };

  // 이름의 가운데 글자를 *로 치환하는 함수
  const maskMiddleName = (name: string) => {
    if (name.length <= 2) return name;
    const middleIndex = Math.floor(name.length / 2);
    return name.substring(0, middleIndex) + "*" + name.substring(middleIndex + 1);
  };

  // 전화번호 뒤 4자리를 제외하고 나머지를 *로 치환하는 함수
  const maskPhoneExceptLast4 = (phone: string) => {
    if (phone.length < 4) return phone;
    const phoneDigits = phone.replace(/-/g, "");
    if (phoneDigits.length <= 4) return phone;
    const last4 = phoneDigits.substring(phoneDigits.length - 4);
    const maskedPart = "*".repeat(phoneDigits.length - 4);
    return maskedPart + last4;
  };

  // 선택된 회원 정보 확인
  const confirmUserSelection = (user: any) => {
    setSelectedUser(user);
    setShowMatchingUsers(false);
  };

  // 새로운 회원으로 가입 진행
  const proceedAsNewUser = () => {
    setShowMatchingUsers(false);
    setMatchingUsers([]);
    handleAuth();
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

      // 기존 회원 정보 검색이 필요한지 확인
      if (!selectedUser && !showMatchingUsers && matchingUsers.length === 0) {
        await searchExistingUsers();
        return; // 검색 결과에 따라 사용자에게 선택하도록 함
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        // Firebase Authentication에 계정 생성
        const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
        const newUser = userCredential.user;
        
        // Firestore에 사용자 정보 생성 또는 기존 사용자 정보 업데이트
        try {
          if (selectedUser) {
            // 기존 사용자와 연결 - 기존 정보에 회원가입 폼 정보 업데이트
            const updatedUserData = {
              ...selectedUser,
              email: email,
              // 회원가입 폼의 정보로 업데이트 (기존 정보 유지하면서 새 정보 추가)
              carNumber: registrationForm.carNumber.trim() || selectedUser.carNumber || "",
              address: registrationForm.address.trim() || selectedUser.address || "",
              organization: registrationForm.organization.trim() || selectedUser.organization || "",
              updatedAt: new Date()
            };
            
            await setDoc(doc(db, "users", selectedUser.id), updatedUserData);
            console.log("기존 사용자 정보와 연결 완료 - 회원가입 정보 업데이트됨");
          } else {
            // 새로운 사용자 생성
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
            console.log("새로운 사용자 정보 생성 완료");
          }
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

                {/* 기존 회원 검색 결과 표시 */}
                {showMatchingUsers && matchingUsers.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-md font-medium text-blue-800 mb-3">
                      🎉 기존 고객 정보를 찾았습니다!
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      관리자에게 이미 등록된 정보와 일치합니다. 본인의 정보라면 연결하여 가입하시면 됩니다.
                    </p>
                    <div className="space-y-2">
                      {matchingUsers.map((user, index) => (
                        <div key={user.id} className="p-3 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">이름:</span> {maskMiddleName(user.name)}
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">전화번호:</span> {maskPhoneExceptLast4(user.phone)}
                              </div>
                              {user.address && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">주소:</span> {user.address}
                                </div>
                              )}
                              {user.organization && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-medium">소속:</span> {user.organization}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => confirmUserSelection(user)}
                              className="ml-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              내 정보입니다
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2">
                        <button
                          onClick={proceedAsNewUser}
                          className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                          아니요, 새로운 회원으로 가입하겠습니다
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 선택된 회원 정보 표시 */}
                {selectedUser && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-md font-medium text-green-800 mb-2">
                      ✅ 연결할 회원 정보가 선택되었습니다
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      기존 고객 정보와 연결하여 가입됩니다. 아래 정보가 본인 정보인지 확인해주세요.
                    </p>
                    <div className="text-sm text-green-700">
                      <div>이름: {selectedUser.name}</div>
                      <div>전화번호: {selectedUser.phone}</div>
                      {selectedUser.address && <div>주소: {selectedUser.address}</div>}
                      {selectedUser.organization && <div>소속: {selectedUser.organization}</div>}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setShowMatchingUsers(true);
                      }}
                      className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                    >
                      다른 정보로 변경
                    </button>
                  </div>
                )}

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
                disabled={loading || isVerifyingUser}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                {loading ? "처리 중..." : 
                 isVerifyingUser ? "회원 정보 확인 중..." :
                 isNew ? (selectedUser ? "기존 고객과 연결하여 가입" : "새 회원으로 가입") : "로그인"}
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
