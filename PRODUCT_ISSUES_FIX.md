# 🔧 제품 추가/보기 문제 해결 가이드

## 🚨 문제 진단

제품 추가와 제품 보기 기능이 안 되는 주요 원인들:

1. **Firebase 권한 오류** - 가장 일반적인 원인
2. **Firestore 데이터베이스 미생성**
3. **인증 시스템 미설정**
4. **보안 규칙 문제**

## 📋 단계별 해결 방법

### 1단계: Firebase Console 설정

1. **Firebase Console 접속**
   - [console.firebase.google.com](https://console.firebase.google.com/) 방문
   - 프로젝트 `rhythmdancewear-a88d4` 선택

2. **Firestore Database 생성**
   - 왼쪽 메뉴에서 **Firestore Database** 클릭
   - **데이터베이스 만들기** 클릭
   - **테스트 모드에서 시작** 선택
   - 위치 선택 (가까운 지역)
   - **완료** 클릭

3. **보안 규칙 설정**
   - Firestore Database → **규칙** 탭
   - 다음 코드로 교체:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. **인증 활성화**
   - 왼쪽 메뉴에서 **Authentication** 클릭
   - **시작하기** 클릭
   - **Sign-in method** 탭
   - **이메일/비밀번호** 활성화
   - **저장** 클릭

### 2단계: 웹사이트에서 테스트

1. **Firebase 연결 테스트**
   - `http://localhost:3000/firebase-test` 방문
   - "Test Firebase Permissions" 클릭
   - 모든 테스트가 성공하는지 확인

2. **관리자 계정 생성**
   - `http://localhost:3000/login` 방문
   - 이메일: `admin@rhythm.com`
   - 비밀번호: `admin123`
   - 회원가입 또는 로그인

3. **테스트 제품 추가**
   - `http://localhost:3000/admin` 방문
   - "테스트 제품 추가" 버튼 클릭
   - 제품이 성공적으로 추가되는지 확인

4. **제품 목록 확인**
   - `http://localhost:3000/products` 방문
   - 추가된 제품이 표시되는지 확인

## 🧪 디버깅 도구

### 1. Firebase 테스트 페이지
- URL: `/firebase-test`
- Firebase 연결 상태 확인
- 권한 문제 진단

### 2. 테스트 제품 추가 페이지
- URL: `/admin/add-test-product`
- 간단한 테스트 제품 추가
- 오류 메시지 상세 확인

### 3. 브라우저 개발자 도구
- F12 키로 개발자 도구 열기
- Console 탭에서 오류 메시지 확인
- Network 탭에서 Firebase 요청 상태 확인

## 🚨 일반적인 오류와 해결책

### 오류 1: "Missing or insufficient permissions"
**해결책**: Firebase Console에서 보안 규칙을 테스트 모드로 변경

### 오류 2: "Database not found"
**해결책**: Firestore Database를 생성해야 함

### 오류 3: "Authentication not enabled"
**해결책**: Authentication → Email/Password 활성화

### 오류 4: "User not found"
**해결책**: 관리자 계정을 먼저 생성해야 함

## ✅ 성공 확인 방법

다음 항목들이 모두 작동하면 문제가 해결된 것입니다:

- ✅ `/firebase-test`에서 모든 테스트 통과
- ✅ `/login`에서 관리자 계정 로그인 성공
- ✅ `/admin/add-test-product`에서 테스트 제품 추가 성공
- ✅ `/products`에서 제품 목록 표시
- ✅ `/admin/add-product`에서 새 제품 추가 성공

## 🔧 추가 문제 해결

### 문제가 지속되는 경우:

1. **브라우저 캐시 삭제**
   - Ctrl+Shift+R (하드 리프레시)

2. **Firebase 프로젝트 재확인**
   - 프로젝트 ID: `rhythmdancewear-a88d4`
   - 올바른 프로젝트인지 확인

3. **개발자 도구에서 오류 확인**
   - F12 → Console 탭
   - 빨간색 오류 메시지 확인

4. **Firebase Console에서 실시간 확인**
   - Firestore Database → Data 탭
   - 문서가 실제로 생성되었는지 확인

## 📞 지원

문제가 해결되지 않으면:

1. 브라우저 개발자 도구의 오류 메시지 스크린샷
2. Firebase Console의 현재 설정 상태
3. `/firebase-test` 페이지의 테스트 결과

이 정보들을 제공해주시면 더 정확한 해결책을 제시할 수 있습니다.

---

**이 가이드를 따라하면 제품 추가와 보기 기능이 정상적으로 작동할 것입니다!** 🎉 