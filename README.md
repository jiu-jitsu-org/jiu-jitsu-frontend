# Jiu-Jitsu-Frontend

## 개요

이 저장소는 여러 개발자가 Git 기반으로 협업하기 위한 `Next.js + React + Clean Architecture` 프로젝트다.

핵심 목적은 아래 3가지다.

1. 여러 사람과의 형상 관리 및 협업이 쉬운 구조 유지
2. Server Component와 Client Component의 책임 분리
3. 기능 단위 구조로 확장성과 유지보수성 확보

현재 실제 애플리케이션은 `oss-frontend/` 아래에 존재한다.

## 왜 이런 구조를 사용하는가

이 프로젝트는 단순히 페이지를 빠르게 만드는 것보다, 다음 상황을 버틸 수 있는 구조를 목표로 한다.

- 여러 개발자가 동시에 다른 기능을 개발하는 상황
- 외부 REST API가 계속 추가되는 상황
- 초기 서버 렌더링과 사용자 동작 기반 갱신을 함께 운영해야 하는 상황
- 인증, 상품, 주문, 사용자 관리처럼 기능이 점점 늘어나는 상황

그래서 아래 원칙을 따른다.

- 화면 라우팅 엔트리는 `app/`에서 관리한다.
- 비즈니스 책임은 `features/`에서 기능 단위로 분리한다.
- 초기 조회는 Server Component에서 application layer를 호출한다.
- 사용자 동작은 Client Component에서 Server Action으로 연결한다.
- 공통 코드는 `shared/`로 모은다.
- 환경 변수와 설정은 `config/`에서 중앙 관리한다.

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
│   ├── service-info/
│   │   └── page.tsx
│   ├── styles/
│   │   └── tokens/            # 자동 생성 (npm run tokens)
│   │       ├── primitive.css
│   │       ├── semantic.css
│   │       ├── component.css
│   │       └── theme.css
│   ├── version-info/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── config/
│   └── env.ts
├── features/
│   ├── bootstrap/
│   │   ├── application/
│   │   │   ├── bootstrap-use-case-factory.ts
│   │   │   ├── get-bootstrap-info-page-data.ts
│   │   │   └── get-bootstrap-info.ts
│   │   ├── domain/
│   │   │   ├── bootstrap-info.ts
│   │   │   └── bootstrap-repository.ts
│   │   ├── infrastructure/
│   │   │   └── external-bootstrap-repository.ts
│   │   └── presentation/
│   │       ├── actions/
│   │       │   ├── bootstrap-info-action-state.ts
│   │       │   └── load-bootstrap-info-action.ts
│   │       ├── README.md
│   │       └── version-info-page.tsx
│   └── service/
│       └── presentation/
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
- route segment 단위 loading/error 파일

역할 기준:

- 화면 라우팅은 여기서 시작한다.
- 기능별 비즈니스 로직은 여기서 직접 구현하지 않는다.
- 초기 데이터 조회가 필요하면 feature application layer의 page data query를 호출한다.

### `src/features`

기능 단위 코드를 모으는 핵심 디렉터리다.

기본 형태:

```txt
src/features/
└── [feature]/
    ├── presentation/
    ├── application/
    ├── domain/
    └── infrastructure/
```

### `src/features/[feature]/presentation`

UI와 사용자 상호작용을 담당한다.

들어갈 수 있는 것:

- 컴포넌트
- 클라이언트 훅
- Server Action
- 화면 전용 상태 타입
- 뷰 모델

들어가면 안 되는 것:

- 외부 REST API 직접 호출 로직
- 환경 변수 접근
- 핵심 도메인 규칙

현재 예시:

- `bootstrap/presentation/version-info-page.tsx`
- `bootstrap/presentation/actions/load-bootstrap-info-action.ts`
- `bootstrap/presentation/actions/bootstrap-info-action-state.ts`

### `src/features/[feature]/application`

유스케이스와 서비스 흐름을 담당한다.

현재 bootstrap 기준:

- `get-bootstrap-info.ts`
  - 단일 application use case다.
  - `BootstrapRepository` 계약을 통해 bootstrap 정보를 조회한다.
  - repository 구현체가 무엇인지 알지 않는다.
- `bootstrap-use-case-factory.ts`
  - use case 실행에 필요한 concrete dependency를 조립한다.
  - `createServerHttpClient`, `ExternalBootstrapRepository`, `GetBootstrapInfoUseCase` 연결을 담당한다.
  - page나 action에 조립 코드가 흩어지는 것을 막는다.
- `get-bootstrap-info-page-data.ts`
  - Server Component와 Server Action에서 함께 쓰는 page-level query다.
  - use case 결과를 화면이 바로 처리할 수 있는 성공/실패 상태로 변환한다.
  - `HttpError`를 presentation-friendly error state로 변환한다.

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

- 외부 REST API repository 구현
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
- 공통 응답 타입

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
  유스케이스 실행, page data query, 의존성 조립
- `Domain`
  핵심 모델, 규칙, 계약
- `Infrastructure`
  외부 REST API, DB, 저장소 등 외부 의존성 구현

중요한 점:

- `app`에 외부 fetch 상세 로직을 두지 않는다.
- 외부 REST API 상세 경로는 `infrastructure`로 내린다.
- Server Action은 직접 외부 REST API를 호출하지 않고 application layer를 호출한다.
- Server Component는 초기 데이터 조회 시 application page data query를 직접 호출한다.

## 실제 파일 흐름

### 초기 Server Component 조회 후 Client Component 전달

`/version-info`의 첫 렌더링은 아래 흐름을 따른다.

```txt
src/app/version-info/page.tsx
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/application/bootstrap-use-case-factory.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/create-server-http-client.ts
  -> src/shared/lib/http/http-client.ts
  -> external REST API
  -> VersionInfoPage props
  -> useActionState initialState
```

각 단계 역할:

- `page.tsx`
  - `searchParams`에서 `osName`을 읽는다.
  - 값이 없으면 기본값 `ANDROID`를 사용한다.
  - `getBootstrapInfoPageData`를 호출한다.
  - 성공 또는 실패 결과를 `VersionInfoPage` props로 넘긴다.
- `get-bootstrap-info-page-data.ts`
  - page/action에서 공통으로 쓰는 화면 단위 조회 함수다.
  - 성공 시 `BootstrapInfoResponse`를 반환한다.
  - 실패 시 화면이 표시할 `error`, `errorDetails`로 변환한다.
- `bootstrap-use-case-factory.ts`
  - HTTP client와 repository 구현체를 만든다.
  - `GetBootstrapInfoUseCase`를 생성해 반환한다.
- `get-bootstrap-info.ts`
  - bootstrap 정보 조회라는 단일 의도를 가진 use case다.
  - `BootstrapRepository` interface만 의존한다.
- `external-bootstrap-repository.ts`
  - 실제 외부 REST path와 query parameter를 알고 있다.
  - 공통 `HttpClient`를 사용해 요청한다.
- `version-info-page.tsx`
  - Client Component다.
  - Server Component에서 받은 초기 props를 `useActionState`의 initial state로 사용한다.

### Client Component 사용자 동작 후 UI 갱신

사용자가 `Reload from Server Action` 버튼을 누르면 아래 흐름을 따른다.

```txt
VersionInfoPage button click
  -> useActionState(loadBootstrapInfoAction, initialState)
  -> src/features/bootstrap/presentation/actions/load-bootstrap-info-action.ts
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/application/bootstrap-use-case-factory.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/http-client.ts
  -> external REST API
  -> BootstrapInfoActionState
  -> VersionInfoPage rerender
```

각 단계 역할:

- `version-info-page.tsx`
  - `"use client"` 컴포넌트다.
  - `useActionState`로 action state, action dispatcher, pending 상태를 받는다.
  - pending 동안 버튼을 비활성화하고 `Loading...`을 표시한다.
  - action 결과가 돌아오면 같은 컴포넌트 안에서 UI를 갱신한다.
- `load-bootstrap-info-action.ts`
  - `"use server"` Server Action이다.
  - form payload의 `osName`을 읽는다.
  - application page data query를 호출한다.
  - Client Component가 바로 렌더링할 수 있는 `BootstrapInfoActionState`를 반환한다.
- `bootstrap-info-action-state.ts`
  - Client Component에서 사용하는 action state 타입을 정의한다.
  - upstream response 타입과 UI 상태 타입을 분리한다.

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

규칙:

- 브라우저에 노출할 필요가 없는 값은 `NEXT_PUBLIC_` 없이 서버 전용으로 둔다.
- Base URL, timeout, 서버 인증 정보는 `config/env.ts`를 통해 읽는다.

## 새 외부 REST 연동을 추가하는 방법

예를 들어 `product` 조회를 추가한다면 다음 순서를 따른다.

1. `src/features/product/domain`에 모델과 repository interface 정의
2. `src/features/product/application`에 use case 작성
3. 필요하면 `application`에 factory와 page data query 작성
4. `src/features/product/infrastructure`에 외부 REST repository 구현
5. 초기 조회가 필요하면 `src/app/products/page.tsx`에서 page data query 호출
6. 사용자 동작이 필요하면 `src/features/product/presentation/actions`에 Server Action 작성
7. `src/features/product/presentation`에 UI 작성

예시 구조:

```txt
src/features/product/
├── application/
│   ├── get-product-list-page-data.ts
│   ├── product-use-case-factory.ts
│   └── get-product-list.ts
├── domain/
│   ├── product.ts
│   └── product-repository.ts
├── infrastructure/
│   └── external-product-repository.ts
└── presentation/
    ├── actions/
    └── product-list.tsx
```

## 협업 규칙

- 작업은 기능 단위로 나눈다.
- 한 기능의 비즈니스 로직은 되도록 해당 feature 안에서 끝낸다.
- 공통화는 재사용이 실제로 확인된 뒤에 진행한다.
- 구조를 바꿨다면 `README.md`와 `AGENTS.md`도 함께 갱신한다.
- Server Component, Client Component, Server Action의 책임을 섞지 않는다.
- 외부 REST API 호출은 가능한 한 shared HTTP client를 재사용한다.

## 현재 상태

현재 기준으로 아래가 준비되어 있다.

- `src/app` 기반 Next.js App Router
- `src/config/env.ts` 기반 환경 변수 관리
- `src/shared/lib/http` 기반 공통 서버 HTTP 클라이언트
- `bootstrap` feature 기반 초기 Server Component 조회 구현
- `VersionInfoPage` Client Component와 `useActionState` 기반 Server Action 갱신 구현
- `.env.development`, `.env.production` 기반 Base URL 분기
- `design-tokens/` 기반 컬러 디자인 토큰 파이프라인 (`npm run tokens`)

## 검증

작업 후 변경 범위에 맞게 아래를 수행한다.

```bash
npm run lint
npm run build
```

화면 또는 사용자 동작을 바꿨다면 `/version-info?osName=ANDROID`에서 초기 렌더링과 버튼 갱신을 함께 확인한다.

## 참고

실제 작업 전에는 아래 문서를 함께 보는 것을 권장한다.

- 루트 `AGENTS.md`
- `oss-frontend/AGENTS.md`
- `oss-frontend/README.md`
