# Jiu-Jitsu-Frontend

## 프로젝트 목적

이 저장소는 여러 개발자가 Git 기반으로 협업할 수 있도록 설계된 `Next.js + React + BFF` 프로젝트입니다.

핵심 목표는 아래 3가지입니다.

1. 여러 사람과의 형상 관리 및 협업을 고려한 구조
2. Next.js를 통한 REST API(BFF)와 React Web 페이지의 통합 운영
3. Clean Architecture 기반의 기능 분리로 확장성과 유지보수성 확보

## 요구사항 정리

### 1. Git 기반 협업

- 여러 사람이 동시에 작업해도 충돌 범위를 줄일 수 있어야 합니다.
- 역할과 책임이 분리된 디렉터리 구조가 필요합니다.
- 공통 코드와 기능 코드를 구분해 변경 영향 범위를 명확히 해야 합니다.

### 2. Next.js 기반 Web + BFF

- 사용자 화면은 React 기반 Web 페이지로 구성합니다.
- 외부 API 호출은 가능한 한 Next.js Route Handler를 통해 BFF로 중계합니다.
- 브라우저는 `app/`의 페이지를 사용하고, 서버 측 중계 로직은 `app/api/`에 둡니다.

### 3. Clean Architecture 기반 구조

- UI, 비즈니스 흐름, 도메인 규칙, 외부 연동 책임을 분리합니다.
- 기능 단위로 묶어서 협업 시 작업 경계를 명확히 합니다.
- 이후 인증, 상품, 주문 등 기능이 늘어나도 구조를 유지할 수 있어야 합니다.

## 요구사항과 현재 구조의 대응

현재 프로젝트는 요구사항을 반영하기 위해 `src/` 전환형 구조를 사용합니다.

```txt
.
├── README.md
└── oss-frontend/
    ├── public/
    ├── src/
    │   ├── app/
    │   ├── config/
    │   ├── features/
    │   └── shared/
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
```

이 구조가 요구사항과 연결되는 방식은 다음과 같습니다.

- `src/app`
  React Web 페이지와 Next.js 엔트리를 관리합니다.
- `src/app/api`
  REST API(BFF) 진입 지점을 둡니다.
- `src/features`
  기능 단위로 코드를 분리해 협업 충돌과 책임 혼선을 줄입니다.
- `src/shared`
  공통 컴포넌트, 타입, 유틸을 모아 중복을 줄입니다.
- `src/config`
  환경 변수, 상수, 런타임 설정을 중앙 관리합니다.

## 프로젝트 구조

```txt
oss-frontend/src/
├── app/                    # React Web + Next.js App Router 엔트리
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/                # Next.js Route Handler 기반 BFF
├── features/               # 기능 단위 모듈
│   └── [feature]/
│       ├── presentation/   # 화면, 컴포넌트, hooks
│       ├── application/    # use case, 서비스 흐름
│       ├── domain/         # entity, interface, 규칙
│       └── infrastructure/ # API client, repository 구현
├── shared/                 # 공통 컴포넌트, 유틸, 타입, 라이브러리
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── utils/
└── config/                 # 환경 변수, 상수, 설정
```

## 아키텍처 원칙

```txt
Presentation -> Application -> Domain
                    ↓
             Infrastructure
```

- `Presentation`
  사용자가 보는 화면과 상호작용을 담당합니다.
- `Application`
  화면에서 들어온 요청을 비즈니스 흐름으로 조합합니다.
- `Domain`
  핵심 규칙과 데이터 의미를 정의합니다.
- `Infrastructure`
  외부 API, DB, 저장소 구현 등 외부 의존성을 담당합니다.

## 협업 관점에서의 장점

- 기능별 디렉터리 분리로 담당자별 작업 경계가 명확합니다.
- 공통 코드와 기능 코드를 구분해 리뷰 범위를 좁힐 수 있습니다.
- BFF를 통해 클라이언트와 외부 API 결합도를 낮출 수 있습니다.
- 구조가 고정되어 신규 인원이 들어와도 온보딩이 쉬워집니다.

## 현재 상태와 확장 방향

- 현재 앱 엔트리는 `oss-frontend/src/app` 기준으로 정리되어 있습니다.
- `features`, `shared`, `config`는 확장을 위한 기본 골격이 준비되어 있습니다.
- 이후 실제 기능 개발 시 `product`, `auth`, `order` 같은 feature를 추가하는 방식으로 확장합니다.

## 운영 규칙

- `public/`, `package.json`, `next.config.ts`, `.env.*`는 `oss-frontend` 루트에 유지합니다.
- 화면 라우팅은 `src/app`에서, 기능 로직은 `src/features`에서 관리합니다.
- 외부 API 연동은 가능하면 `src/app/api`를 통해 BFF로 노출합니다.
- 공통 유틸은 `src/shared`, 환경 및 상수는 `src/config`에 둡니다.
