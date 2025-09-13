# 🔥 Firebase 권한 오류 해결 가이드

## 🚨 현재 문제
로그인 시 "Missing or insufficient permissions" 오류가 발생합니다.

## 📋 단계별 해결 방법

### 1단계: Firebase Console 접속
1. 브라우저에서 [Firebase Console](https://console.firebase.google.com/) 방문
2. Google 계정으로 로그인
3. 프로젝트 `rhythmdancewear-a88d4` 선택

### 2단계: Firestore Database 생성
1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 버튼 클릭
3. **테스트 모드에서 시작** 선택 (중요!)
4. 위치 선택 (가까운 지역, 예: asia-northeast3)
5. **완료** 클릭

### 3단계: 보안 규칙 설정
1. Firestore Database 페이지에서 **규칙** 탭 클릭
2. 기존 규칙을 모두 삭제하고 다음 코드로 교체:

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

3. **게시** 버튼 클릭

### 4단계: Authentication 활성화
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **시작하기** 버튼 클릭
3. **Sign-in method** 탭 클릭
4. **이메일/비밀번호** 행에서 **편집** 클릭
5. **사용** 체크박스 선택
6. **저장** 버튼 클릭

### 5단계: 웹사이트에서 테스트
1. `http://localhost:3000/firebase-test` 방문
2. **Test Firebase Permissions** 버튼 클릭
3. 모든 테스트가 성공하는지 확인

### 6단계: 관리자 계정 생성
1. `http://localhost:3000/login` 방문
2. 이메일: `admin@rhythm.com`
3. 비밀번호: `admin123`
4. **회원가입** 클릭 (계정이 없을 경우)
5. 로그인 성공 확인

## 🧪 테스트 순서

### 테스트 1: Firebase 연결 확인
```bash
# 브라우저에서 접속
http://localhost:3000/firebase-test
```

### 테스트 2: 관리자 계정 생성
```bash
# 브라우저에서 접속
http://localhost:3000/login
```

### 테스트 3: 제품 추가 테스트
```bash
# 관리자로 로그인 후
http://localhost:3000/admin/add-test-product
```

## 🚨 일반적인 문제와 해결책

### 문제 1: "Database not found"
**해결책**: Firestore Database를 생성해야 합니다.

### 문제 2: "Authentication not enabled"
**해결책**: Authentication → Email/Password를 활성화해야 합니다.

### 문제 3: "Rules not published"
**해결책**: 보안 규칙을 게시해야 합니다.

### 문제 4: "Wrong project"
**해결책**: 올바른 프로젝트 `rhythmdancewear-a88d4`를 선택해야 합니다.

## ✅ 성공 확인 방법

다음 항목들이 모두 성공하면 문제가 해결된 것입니다:

- ✅ `/firebase-test`에서 모든 테스트 통과
- ✅ `/login`에서 관리자 계정 생성/로그인 성공
- ✅ `/admin/add-test-product`에서 테스트 제품 추가 성공
- ✅ `/products`에서 제품 목록 표시

## 🔧 추가 문제 해결

### 브라우저 캐시 삭제
- Ctrl+Shift+R (하드 리프레시)
- 또는 개발자 도구 → Network 탭 → Disable cache 체크

### Firebase 프로젝트 재확인
- 프로젝트 ID: `rhythmdancewear-a88d4`
- 올바른 프로젝트인지 확인

### 개발자 도구에서 오류 확인
- F12 → Console 탭
- 빨간색 오류 메시지 확인

## 📞 지원

문제가 지속되면 다음 정보를 제공해주세요:

1. **Firebase Console 스크린샷**
   - Firestore Database 상태
   - Authentication 설정
   - 보안 규칙 내용

2. **브라우저 개발자 도구 오류**
   - F12 → Console 탭의 오류 메시지

3. **테스트 결과**
   - `/firebase-test` 페이지의 테스트 결과

---

**이 가이드를 따라하면 Firebase 권한 오류가 해결되고 로그인이 정상적으로 작동할 것입니다!** 🎉 