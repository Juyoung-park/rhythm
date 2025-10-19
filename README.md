# Elysian Flow Dance Wear - 수제작 라인댄스 의상 쇼핑몰

어머니의 수제작 라인댄스 의상 비즈니스를 위한 완전한 웹사이트입니다.

## 🎯 주요 기능

### 고객용 기능
- **제품 카탈로그**: 다양한 라인댄스 의상 브라우징
- **회원가입/로그인**: 개인 계정으로 주문 관리
- **개인 정보 관리**: 신체 치수 및 연락처 정보 저장
- **주문 시스템**: 원하는 제품 선택 및 주문
- **주문 내역 확인**: 이전 주문 상태 및 정보 확인

### 관리자 기능 (어머니용)
- **제품 관리**: 새 제품 추가, 기존 제품 삭제
- **고객 관리**: 고객 정보 및 신체 치수 확인
- **주문 관리**: 주문 상태 업데이트 (대기중 → 제작중 → 완료)

## 🚀 시작하기

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 관리자 계정으로 로그인
- 이메일: `admin@rhythm.com`
- 비밀번호: `admin123`

### 3. 웹사이트 사용법

#### 고객용 사용법
1. **홈페이지** (`/`): Elysian Flow 브랜드 소개 및 메인 페이지
2. **제품 보기** (`/products`): 모든 제품 카탈로그
3. **회원가입/로그인** (`/login`): 개인 계정 생성
4. **내 정보** (`/my-info`): 개인 정보 및 주문 내역 관리
5. **주문하기** (`/order/[productId]`): 특정 제품 주문

#### 관리자용 사용법
1. **관리자 패널** (`/admin`): 제품, 고객, 주문 관리
2. **새 제품 추가** (`/admin/add-product`): 새로운 제품 등록

## 📱 페이지별 상세 설명

### 홈페이지 (`/`)
- Elysian Flow 브랜드 소개
- 주요 특징 (수제작, 품질 보장, 빠른 배송)
- 제품 보기 및 주문하기 버튼

### 제품 카탈로그 (`/products`)
- 모든 제품을 그리드 형태로 표시
- 카테고리별 필터링 (전체, 드레스, 상의, 하의, 액세서리)
- 각 제품의 상세 정보 (가격, 사이즈, 색상)
- 로그인 시 주문 버튼, 비로그인 시 로그인 안내

### 로그인/회원가입 (`/login`)
- 기존 고객 로그인
- 새 고객 회원가입
- 관리자 계정 정보 표시

### 내 정보 (`/my-info`)
- **개인 정보 탭**: 이름, 연락처, 신체 치수 관리
- **주문 내역 탭**: 이전 주문 목록 및 상태 확인

### 주문 페이지 (`/order/[productId]`)
- 선택한 제품 정보 표시
- 사이즈 및 색상 선택
- 배송 정보 입력
- 특별 요청사항 작성

### 관리자 패널 (`/admin`)
- **제품 관리**: 제품 목록, 삭제, 새 제품 추가 링크
- **고객 관리**: 고객 정보, 신체 치수, 등록일 확인
- **주문 관리**: 주문 상태 업데이트 (대기중/제작중/완료)

### 새 제품 추가 (`/admin/add-product`)
- 제품명, 설명, 가격 입력
- 카테고리 선택 (드레스/상의/하의/액세서리)
- 이미지 URL (선택사항)
- 사이즈 및 색상 옵션 설정

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Vercel (권장)

## 🔧 설정 및 배포

### Firebase 설정
1. Firebase Console에서 새 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호)
3. Firestore Database 생성
4. `src/lib/firebase.ts`에 Firebase 설정 정보 입력

### 환경 변수
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 배포 (Vercel)
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 완료

## 📊 데이터베이스 구조

### Collections

#### users
```typescript
{
  name: string,
  phone: string,
  height: number,
  bust: number,
  waist: number,
  hip: number,
  updatedAt: timestamp
}
```

#### products
```typescript
{
  name: string,
  description: string,
  price: number,
  category: string,
  imageUrl?: string,
  sizes: string[],
  colors: string[],
  createdAt: timestamp
}
```

#### orders
```typescript
{
  customerId: string,
  productId: string,
  customerName: string,
  productName: string,
  selectedSize: string,
  selectedColor: string,
  specialRequests?: string,
  deliveryAddress: string,
  phoneNumber: string,
  status: string,
  createdAt: timestamp
}
```

## 🎨 디자인 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **Purple/Pink 그라데이션**: 라인댄스 의상에 어울리는 색상
- **모던 UI**: 깔끔하고 직관적인 인터페이스
- **로딩 상태**: 사용자 경험 향상을 위한 로딩 애니메이션

## 🔒 보안

- Firebase Authentication으로 사용자 인증
- 관리자 권한 제한 (`admin@rhythm.com`만 접근)
- 클라이언트 사이드 데이터 검증

## 📞 지원

문제가 발생하거나 추가 기능이 필요하시면 언제든 연락주세요!

---

**Elysian Flow Dance Wear** - 수제작 라인댄스 의상의 아름다움을 만나보세요 💃
