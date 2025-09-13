import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";

export default function FirebaseStatusPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebase = async () => {
    setLoading(true);
    setStatus([]);

    try {
      addStatus("🔍 Firebase 연결 테스트 시작...");
      
      // Test 1: Basic connection
      addStatus("✅ Firebase 설정 로드됨");
      
      // Test 2: Firestore write
      addStatus("📝 Firestore 쓰기 권한 테스트...");
      const testDoc = await addDoc(collection(db, "test"), {
        message: "Firebase connection test",
        timestamp: new Date()
      });
      addStatus(`✅ Firestore 쓰기 성공! 문서 ID: ${testDoc.id}`);
      
      // Test 3: Firestore read
      addStatus("📖 Firestore 읽기 권한 테스트...");
      const querySnapshot = await getDocs(collection(db, "test"));
      addStatus(`✅ Firestore 읽기 성공! ${querySnapshot.size}개 문서 읽음`);
      
      // Test 4: Authentication
      addStatus("🔐 Authentication 테스트...");
      try {
        await createUserWithEmailAndPassword(auth, "test@rhythm.com", "test123456");
        addStatus("✅ Authentication 성공!");
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          addStatus("ℹ️ 테스트 사용자가 이미 존재함 (정상)");
        } else {
          addStatus(`⚠️ Authentication 오류: ${error.message}`);
        }
      }
      
      addStatus("🎉 모든 Firebase 테스트 통과!");
      addStatus("✅ 이제 로그인과 제품 관리가 가능합니다!");
      
    } catch (error: any) {
      console.error("Firebase test error:", error);
      addStatus(`❌ 오류 발생: ${error.message}`);
      
      if (error.code === "permission-denied") {
        addStatus("💡 Firebase 권한 오류입니다.");
        addStatus("📋 해결 방법:");
        addStatus("   1. Firebase Console 방문");
        addStatus("   2. Firestore Database 생성 (테스트 모드)");
        addStatus("   3. 보안 규칙을 'allow read, write: if true'로 설정");
        addStatus("   4. Authentication → Email/Password 활성화");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Firebase 상태 확인</h1>
          <p className="text-gray-600">Firebase 연결과 권한을 테스트합니다</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Firebase 설정 체크리스트:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>✅ 프로젝트: rhythmdancewear-a88d4</div>
              <div>❓ Firestore Database 생성됨?</div>
              <div>❓ 보안 규칙이 테스트 모드로 설정됨?</div>
              <div>❓ Authentication → Email/Password 활성화됨?</div>
            </div>
          </div>

          <button
            onClick={testFirebase}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium mb-6"
          >
            {loading ? "테스트 중..." : "Firebase 연결 테스트"}
          </button>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">테스트 결과:</h2>
            {status.length === 0 ? (
              <p className="text-gray-500">위 버튼을 클릭하여 Firebase 연결을 테스트하세요</p>
            ) : (
              <div className="space-y-1">
                {status.map((message, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <Link
              href="/login"
              className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg hover:bg-green-700"
            >
              로그인 테스트
            </Link>
            <Link
              href="/admin/add-test-product"
              className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700"
            >
              제품 추가 테스트
            </Link>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">문제가 있나요?</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>1. <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a> 방문</div>
              <div>2. 프로젝트 `rhythmdancewear-a88d4` 선택</div>
              <div>3. Firestore Database → 데이터베이스 만들기 (테스트 모드)</div>
              <div>4. 규칙 탭에서 보안 규칙 설정</div>
              <div>5. Authentication → 이메일/비밀번호 활성화</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 