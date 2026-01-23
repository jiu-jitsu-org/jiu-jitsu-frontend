# 주짓수 커뮤니티 Front

주짓수 커뮤니티 웹뷰 프로젝트.

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Ant Design** - UI 컴포넌트 라이브러리
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run local
npm run dev
```

로컬 서버는 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 프로젝트 구조

```
src/
├── api/              # API 관련 파일
│   ├── axios.ts      # Axios 인스턴스 설정
│   └── auth.ts       # 인증 API
├── components/       # 재사용 가능한 컴포넌트
│   └── layout/       # 레이아웃 컴포넌트
├── pages/            # 페이지 컴포넌트
│   ├── Login.tsx     # 로그인 페이지
│   ├── Dashboard.tsx # 대시보드
│   ├── UserManagement.tsx    # 회원 관리
│   └── PostManagement.tsx    # 게시글 관리
├── store/            # 상태 관리
│   └── authStore.ts  # 인증 상태 관리
├── App.tsx           # 메인 앱 컴포넌트
└── main.tsx         # 진입점
```

## 주요 기능

- 로그인/로그아웃
- 대시보드 (통계 정보)
- 회원 관리
- 게시글 관리

## API 연동

백엔드 API와 연동하려면 `src/api/` 폴더의 파일들을 수정하여 실제 API 엔드포인트를 연결하세요.
