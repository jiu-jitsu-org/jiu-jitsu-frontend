# Jiu-Jitsu-Frontend

## 개요

이 저장소는 여러 개발자가 Git 기반으로 협업하기 위한 `Next.js + React + BFF` 프로젝트다.  
핵심 목적은 아래 3가지다.

1. 여러 사람과의 형상 관리 및 협업이 쉬운 구조 유지
2. Next.js를 통한 React Web 페이지와 REST API(BFF)의 통합 운영
3. Clean Architecture 기반 구조로 확장성과 유지보수성 확보

현재 실제 애플리케이션은 `oss-frontend/` 아래에 존재한다.

## 왜 이런 구조를 사용하는가

이 프로젝트는 단순히 페이지를 빠르게 만드는 것보다, 다음 상황을 버틸 수 있는 구조를 목표로 한다.

- 여러 개발자가 동시에 다른 기능을 개발하는 상황
- 외부 API가 계속 추가되는 상황
- 프론트엔드 화면과 서버 중계 로직을 함께 운영해야 하는 상황
- 인증, 상품, 주문, 사용자 관리처럼 기능이 점점 늘어나는 상황

그래서 아래 원칙을 따른다.

- 화면과 서버 API 진입점은 `app/`에서 관리한다.
- 비즈니스 책임은 `features/`에서 기능 단위로 분리한다.
- 공통 코드는 `shared/`로 모은다.
- 환경 변수와 설정은 `config/`에서 중앙 관리한다.
- 외부 API 직접 호출 대신 BFF를 통해 브라우저와 외부 시스템을 분리한다.

## 저장소 구조

```txt
.
├── AGENTS.md
├── README.md
└── oss-frontend/
    ├── AGENTS.md
    ├── README.md
    ├── .env.development
    ├── .env.production
    ├── .env.example
    ├── design-tokens/
    ├── public/
    ├── scripts/
    ├── src/
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
```

### 루트 파일 설명

- `README.md`
  저장소 전체 목적, 구조, 협업 방식을 설명하는 문서
- `AGENTS.md`
  이 저장소에서 작업할 때 따라야 할 구조적 기준과 실무 규칙
- `oss-frontend/`
  실제 Next.js 애플리케이션 루트

## 애플리케이션 구조

현재 애플리케이션은 `src/` 전환형 구조를 사용한다.

```txt
oss-frontend/src/
├── app/
│   ├── api/
│   │   └── bootstrap/
│   │       └── info/
│   │           └── route.ts
│   ├── styles/
│   │   └── tokens/            # 자동 생성 (npm run tokens)
│   │       ├── primitive.css
│   │       ├── semantic.css
│   │       ├── component.css
│   │       └── theme.css
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── config/
│   └── env.ts
├── features/
│   └── bootstrap/
│       ├── application/
│       │   └── get-bootstrap-info.ts
│       ├── domain/
│       │   ├── bootstrap-info.ts
│       │   └── bootstrap-repository.ts
│       ├── infrastructure/
│       │   └── external-bootstrap-repository.ts
│       └── presentation/
│           └── README.md
└── shared/
    ├── lib/
    │   └── http/
    │       ├── create-server-http-client.ts
    │       ├── http-client.ts
    │       └── http-error.ts
    └── types/
        └── api.ts
```

## 디렉터리별 역할

### `src/app`

Next.js App Router의 엔트리 지점이다.

이 디렉터리에는 아래가 들어간다.

- 페이지 라우트
- 레이아웃
- 글로벌 스타일
- BFF API route

예시:

```txt
src/app/
├── page.tsx
├── layout.tsx
└── api/
    └── bootstrap/
        └── info/
            └── route.ts
```

역할 기준:

- 화면 라우팅은 여기서 시작한다.
- 하지만 기능별 비즈니스 로직은 여기서 직접 구현하지 않는다.
- `app/api`는 외부 API를 감싸는 BFF 진입점으로 사용한다.

### `src/features`

기능 단위 코드를 모으는 핵심 디렉터리다.  
협업 시 가장 중요한 폴더다.

기본 형태:

```txt
src/features/
└── [feature]/
    ├── presentation/
    ├── application/
    ├── domain/
    └── infrastructure/
```

예시:

```txt
src/features/bootstrap/
├── application/
├── domain/
├── infrastructure/
└── presentation/
```

이 구조를 쓰는 이유:

- 기능별 작업 경계를 명확히 할 수 있다.
- 한 기능의 코드가 여러 폴더에 흩어지는 문제를 줄일 수 있다.
- 리뷰어가 기능 기준으로 변경 범위를 빠르게 파악할 수 있다.

### `src/features/[feature]/presentation`

UI와 사용자 상호작용을 담당한다.

들어갈 수 있는 것:

- 컴포넌트
- 클라이언트 훅
- 화면 전용 상태 처리
- 뷰 모델

들어가면 안 되는 것:

- 외부 API 직접 호출 로직
- 환경 변수 접근
- 핵심 도메인 규칙

### `src/features/[feature]/application`

유스케이스와 서비스 흐름을 담당한다.

예:

- 어떤 입력을 받아 어떤 repository를 호출할지 결정
- 여러 repository 결과를 조합
- 응답을 화면 친화적으로 변환

현재 예시:

- `bootstrap/application/get-bootstrap-info.ts`

### `src/features/[feature]/domain`

핵심 규칙과 계약을 정의한다.

예:

- Entity
- Value Object
- Request/Response 의미 모델
- Repository interface

현재 예시:

- `bootstrap/domain/bootstrap-info.ts`
- `bootstrap/domain/bootstrap-repository.ts`

### `src/features/[feature]/infrastructure`

외부 시스템과의 실제 연결을 담당한다.

예:

- 외부 API repository 구현
- DB adapter
- storage adapter

현재 예시:

- `bootstrap/infrastructure/external-bootstrap-repository.ts`

### `src/shared`

여러 기능에서 함께 쓰는 코드를 둔다.

현재 공통 계층:

```txt
src/shared/
├── lib/
│   └── http/
└── types/
```

예:

- 공통 HTTP 클라이언트
- 공통 에러 타입
- 공통 API 응답 타입

주의:

- 어떤 코드가 한 feature에서만 쓰인다면 먼저 해당 feature 내부에 둔다.
- 너무 이르게 `shared`로 올리지 않는다.

### `src/config`

환경 변수와 런타임 설정을 중앙 관리한다.

현재 예시:

- `src/config/env.ts`

이 파일의 역할:

- `process.env` 접근 중앙화
- 필수 환경 변수 검증
- 숫자 파싱 같은 공통 처리

## Clean Architecture 적용 방식

이 프로젝트는 아래 의존 방향을 따른다.

```txt
Presentation -> Application -> Domain
                    ↓
             Infrastructure
```

설명:

- `Presentation`
  사용자가 보는 화면과 입력 처리
- `Application`
  유스케이스 실행과 비즈니스 흐름 조합
- `Domain`
  핵심 모델, 규칙, 계약
- `Infrastructure`
  외부 API, DB, 저장소 등 외부 의존성 구현

중요한 점:

- `app/api`에서 직접 외부 fetch를 남발하지 않는다.
- 외부 API 상세 경로는 가급적 `infrastructure`로 내린다.
- route handler는 입력 검증, use case 실행, 응답 포맷팅에 집중한다.

## BFF 구조 설명

이 프로젝트에서 BFF는 브라우저와 외부 API 사이의 서버 중계 계층이다.

흐름:

```txt
Browser
  -> Next.js Route Handler (/api/...)
  -> Use Case
  -> Repository
  -> External API
```

장점:

- 외부 API Base URL을 브라우저에 노출하지 않는다.
- 인증 헤더, 토큰, 로깅, 캐싱을 서버에서 제어할 수 있다.
- 외부 API 에러를 프론트엔드 친화적으로 통일할 수 있다.
- 여러 외부 API를 하나의 프론트엔드용 응답으로 재구성하기 쉽다.

## 현재 구현된 BFF 예시

기준 외부 API:

```txt
GET https://api.developer-chanq.xyz/api/bootstrap/info?osName=ANDROID
```

프로젝트 내부 BFF 라우트:

```txt
GET /api/bootstrap/info?osName=ANDROID
```

실제 파일 흐름:

```txt
src/app/api/bootstrap/info/route.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/http-client.ts
  -> external API
```

각 파일 역할:

- `route.ts`
  요청 파라미터 검증, use case 실행, 성공/실패 응답 표준화
- `get-bootstrap-info.ts`
  bootstrap 정보 조회 유스케이스
- `external-bootstrap-repository.ts`
  업스트림 API 경로와 query string 관리
- `http-client.ts`
  공통 fetch, timeout, URL 생성, 에러 정규화

## 디자인 토큰 (컬러 시스템)

색상은 코드에 하드코딩하지 않고 디자인 토큰으로 관리한다.
Figma에서 정의한 색을 JSON으로 내보내 CSS 변수로 변환하는 구조다.

3단 구성으로, 참조 방향은 **Component → Semantic → Primitive** 다.

- `Primitive` — 원시 색상 팔레트
- `Semantic` — 의미 기반 색상 (primary, text-primary 등)
- `Component` — 컴포넌트별 색상 (button, dialog 등)

파일 흐름:

```txt
oss-frontend/design-tokens/*.tokens.json   (Figma 내보내기 원본 = 단일 소스)
  -> npm run tokens  (scripts/build-tokens.mjs)
  -> oss-frontend/src/app/styles/tokens/*.css   (자동 생성, 직접 수정 금지)
  -> src/app/globals.css 에서 import
```

색을 바꿀 때는 Figma 수정 → JSON 3개를 `design-tokens/`에 덮어쓰기 →
`npm run tokens` 실행. 생성된 CSS는 직접 수정하지 않는다.

코드에서 색을 쓰는 방법:

- Semantic 색 — Tailwind 클래스: `bg-primary`, `text-text-secondary` 등
- Component 색 — CSS 변수: `var(--button-filled-default-bg)` 등

상세 사용법은 `oss-frontend/design-tokens/README.md`를 참고한다.

## 환경 변수 구조

환경 변수 파일은 `oss-frontend/` 루트에 둔다.

파일:

```txt
oss-frontend/
├── .env.example
├── .env.development
└── .env.production
```

현재 사용 값:

```env
API_BASE_URL=https://api.developer-chanq.xyz
API_TIMEOUT_MS=10000
```

규칙:

- 브라우저에 노출할 필요가 없는 값은 `NEXT_PUBLIC_` 없이 서버 전용으로 둔다.
- Base URL, timeout, 서버 인증 정보는 `config/env.ts`를 통해 읽는다.

## 새 API를 추가하는 방법

예를 들어 `product` API를 추가한다면 다음 순서를 따른다.

1. `src/features/product/domain`에 모델과 repository interface 정의
2. `src/features/product/application`에 use case 작성
3. `src/features/product/infrastructure`에 외부 API repository 구현
4. 필요하면 `src/features/product/presentation`에 UI 작성
5. `src/app/api/product/.../route.ts`에서 BFF 엔드포인트 노출

예시 구조:

```txt
src/features/product/
├── application/
│   └── get-product-list.ts
├── domain/
│   ├── product.ts
│   └── product-repository.ts
├── infrastructure/
│   └── external-product-repository.ts
└── presentation/
    └── product-list.tsx
```

예시 흐름:

```txt
GET /api/products
  -> route.ts
  -> GetProductListUseCase
  -> ExternalProductRepository
  -> HttpClient
  -> upstream API
```

## 협업 규칙

- 작업은 기능 단위로 나눈다.
- 한 기능의 비즈니스 로직은 되도록 해당 feature 안에서 끝낸다.
- 공통화는 재사용이 실제로 확인된 뒤에 진행한다.
- 구조를 바꿨다면 `README.md`와 `AGENTS.md`도 함께 갱신한다.
- route handler에 비즈니스 로직을 몰아넣지 않는다.
- 외부 API 호출은 가능한 한 shared HTTP client를 재사용한다.

## 현재 상태

현재 기준으로 아래가 준비되어 있다.

- `src/app` 기반 Next.js App Router
- `src/config/env.ts` 기반 환경 변수 관리
- `src/shared/lib/http` 기반 공통 서버 HTTP 클라이언트
- `bootstrap` feature 기반 예시 BFF 구현
- `.env.development`, `.env.production` 기반 Base URL 분기
- `design-tokens/` 기반 컬러 디자인 토큰 파이프라인 (`npm run tokens`)

## 검증 상태

현재 구현은 아래 검증을 통과했다.

- `npm run lint`
- `npm run build`
- `GET /api/bootstrap/info?osName=ANDROID` 런타임 호출 확인
- `GET /api/bootstrap/info` 유효성 실패 응답 확인

## 참고

실제 작업 전에는 아래 문서를 함께 보는 것을 권장한다.

- 루트 `AGENTS.md`
- `oss-frontend/AGENTS.md`
- `oss-frontend/README.md`
