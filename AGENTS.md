# Jiu-Jitsu-Frontend AGENTS Guide

## 목적

이 문서는 이 저장소에서 작업하는 사람이 프로젝트 구조와 작업 기준을 빠르게 이해하도록 돕기 위한 운영 문서다.

특히 아래 목적에 맞춰 작성한다.

1. 여러 개발자가 구조를 동일하게 이해하도록 돕기
2. 기능 추가 시 어디에 무엇을 넣어야 하는지 빠르게 판단하게 하기
3. Clean Architecture 규칙이 작업 중 무너지지 않게 하기

## 프로젝트 성격

이 저장소는 `Next.js + React + Clean Architecture` 기반 프로젝트다.
실제 애플리케이션 루트는 `oss-frontend/`다.

핵심 목표:

1. Git 기반 협업에 유리한 구조 유지
2. React Server Component와 Client Component의 책임 분리
3. Server Action을 통한 사용자 동작 처리
4. Clean Architecture 기반 확장성 확보

## 문서 우선순위

작업 중 문서를 해석할 때는 아래 우선순위를 따른다.

1. 실제 코드 구조
2. 이 루트 `AGENTS.md`
3. 루트 `README.md`
4. `oss-frontend/AGENTS.md`
5. `oss-frontend/README.md`

문서와 실제 코드가 다르면 실제 코드를 먼저 확인하고, 구조 변경이 있으면 문서를 함께 갱신한다.

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

## 작업 기준이 되는 실제 앱 구조

```txt
oss-frontend/src/
├── app/
│   ├── service-info/
│   ├── styles/
│   ├── version-info/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── config/
├── features/
│   ├── bootstrap/
│   └── service/
├── shared/
└── ...
```

## 핵심 구조 원칙

### 1. `app/`은 엔트리다

`src/app`은 Next.js 라우팅 엔트리만 관리한다.

여기에 두는 것:

- page
- layout
- loading
- error
- route segment 단위 파일

여기에 두지 않는 것:

- 기능별 핵심 비즈니스 로직
- 외부 REST 연동 세부 구현
- 재사용 가능한 도메인 규칙
- 화면 내부의 복잡한 상태 관리

### 2. `features/`는 기능의 본체다

기능별 코드는 가능한 한 `src/features/<feature>` 아래에 모은다.

기본 구조:

```txt
src/features/<feature>/
├── presentation/
├── application/
├── domain/
└── infrastructure/
```

의미:

- `presentation`
  화면, 컴포넌트, hooks, Server Action, 뷰 관련 코드
- `application`
  유스케이스, page data query, 의존성 조립, 흐름 조합
- `domain`
  모델, 인터페이스, 규칙, 계약
- `infrastructure`
  외부 REST API, DB, 저장소 구현

### 3. `shared/`는 공통 코드만 둔다

`shared`는 여러 기능이 함께 쓸 때만 사용한다.

좋은 예:

- 공통 HTTP 클라이언트
- 공통 에러 타입
- 공통 응답 타입

나쁜 예:

- 아직 한 기능에서만 쓰는 코드
- 편해서 일단 넣어두는 기능 전용 유틸

### 4. `config/`는 환경과 설정을 모은다

환경 변수 접근, 앱 상수, 런타임 설정은 `src/config`에서 중앙 관리한다.

현재 기준:

- `src/config/env.ts`

직접 `process.env`를 여러 파일에서 읽기보다 `config`를 통해 읽는 방식을 우선한다.

### 5. `design-tokens/`는 색상의 단일 소스다

색상 디자인 토큰(Primitive → Semantic → Component 3단)의 원본은
`oss-frontend/design-tokens/*.tokens.json` 이다. (Figma 내보내기 결과)

규칙:

- `npm run tokens`(`scripts/build-tokens.mjs`)가 위 JSON을
  `src/app/styles/tokens/*.css` 로 변환한다.
- 생성된 `src/app/styles/tokens/*.css` 는 **직접 수정하지 않는다.**
  색을 바꾸려면 Figma → JSON 갱신 → `npm run tokens` 경로만 사용한다.
- 코드에서는 색상 hex를 하드코딩하지 않고 토큰을 쓴다.
  Semantic은 Tailwind 클래스(`bg-primary` 등), Component는 CSS 변수
  (`var(--button-...)`)로 참조한다.

## Clean Architecture 규칙

의존 방향은 아래를 기준으로 유지한다.

```txt
Presentation -> Application -> Domain
                    ↓
             Infrastructure
```

실무 해석:

- `presentation`은 `application`을 사용할 수 있다.
- `application`은 `domain` 계약을 사용하고 `infrastructure` 구현을 조합할 수 있다.
- `domain`은 가능한 한 프레임워크 상세 구현에 의존하지 않는다.
- `infrastructure`는 외부 세계와 연결되지만, 그 사실을 상위 계층에 과하게 새지 않게 한다.

## 현재 데이터 흐름

### 초기 Server Component 조회

`/version-info`의 초기 렌더링은 Server Component에서 시작한다.

```txt
src/app/version-info/page.tsx
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/application/bootstrap-use-case-factory.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/create-server-http-client.ts
  -> src/shared/lib/http/http-client.ts
  -> External REST API
  -> VersionInfoPage props
```

역할:

- `page.tsx`
  search params를 읽고 기본 `osName`을 정한 뒤 page data query를 호출한다.
- `get-bootstrap-info-page-data.ts`
  page에서 바로 렌더링 가능한 성공/실패 상태로 변환한다.
- `bootstrap-use-case-factory.ts`
  use case, repository, HTTP client 의존성을 조립한다.
- `get-bootstrap-info.ts`
  bootstrap 정보를 조회하는 application use case다.
- `external-bootstrap-repository.ts`
  실제 외부 REST path와 query string을 알고 호출한다.
- `VersionInfoPage`
  Server Component가 넘긴 초기 상태를 Client Component의 초기 action state로 사용한다.

### Client Component 사용자 동작

`VersionInfoPage`는 Client Component다. 사용자가 버튼을 누르면 Server Action이 실행되고,
그 결과가 `useActionState`를 통해 같은 Client Component를 갱신한다.

```txt
src/features/bootstrap/presentation/version-info-page.tsx
  -> useActionState(loadBootstrapInfoAction, initialState)
  -> src/features/bootstrap/presentation/actions/load-bootstrap-info-action.ts
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/application/bootstrap-use-case-factory.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/http-client.ts
  -> External REST API
  -> BootstrapInfoActionState
  -> VersionInfoPage UI 갱신
```

역할:

- `version-info-page.tsx`
  `"use client"` 컴포넌트이며, 초기 props를 `useActionState`의 초기 상태로 넣는다.
- `load-bootstrap-info-action.ts`
  `"use server"` Server Action이다. UI 이벤트를 application query로 연결한다.
- `bootstrap-info-action-state.ts`
  Client Component가 렌더링하기 쉬운 action state 타입을 정의한다.

Server Action은 UI 이벤트 adapter에 가깝다.
외부 REST API를 직접 호출하지 않고 application layer를 호출한다.

## application 파일 역할 기준

`application` 계층에서는 파일 suffix가 책임을 드러내도록 유지한다.

- `*-info.ts`
  단일 use case를 둔다. 예: `get-bootstrap-info.ts`
  입력을 받아 repository 계약을 호출하고, 기능 의도를 이름으로 표현한다.
- `*-factory.ts`
  use case 실행에 필요한 구체 의존성을 조립한다.
  repository 구현체와 shared HTTP client 생성은 여기에 모은다.
- `*-page-data.ts`
  Server Component나 Server Action이 바로 쓰기 좋은 화면 단위 query다.
  여러 use case 조합, 에러 변환, page state 변환을 이곳에서 처리한다.

작은 기능에서는 위 파일들이 단순해 보여도 분리해 둔다.
기능이 커질 때 page와 action에 조립 코드가 쌓이는 것을 막기 위해서다.

## 새 기능 추가 규칙

새 기능을 추가할 때는 아래 질문부터 판단한다.

1. 이 코드는 어느 feature에 속하는가
2. 초기 조회인가, 사용자 동작인가
3. 외부 REST 연동이 필요한가
4. 응답 모델을 domain에 둘 만큼 의미 있는가
5. 기존 shared/config 계층을 재사용할 수 있는가

권장 순서:

1. `domain`에 request/response 의미와 repository interface 정의
2. `application`에 use case 작성
3. 필요하면 `application`에 factory와 page data query 작성
4. `infrastructure`에 실제 외부 연동 구현 작성
5. `presentation`에 UI 또는 Server Action 연결
6. `app`에는 route entry만 얇게 추가

## 환경 변수 규칙

환경 변수 파일은 `oss-frontend/` 루트에 둔다.

사용 파일:

- `.env.development`
- `.env.production`
- `.env.example`

규칙:

- 브라우저에 필요 없는 값은 `NEXT_PUBLIC_`를 붙이지 않는다.
- 서버 전용 값은 `src/config/env.ts`에서 읽는다.
- 새 환경 변수를 추가하면 `.env.example`도 같이 갱신한다.

## 구현 시 지켜야 할 실무 원칙

- Server Component는 초기 조회 시 application page data query를 호출한다.
- Client Component 사용자 동작은 feature 내부 Server Action으로 연결한다.
- Server Action은 `features/<feature>/presentation/actions`에 둔다.
- fetch 상세 로직은 feature infrastructure나 shared HTTP layer로 내린다.
- 비즈니스 로직을 page나 component에 직접 쌓지 않는다.
- 재사용이 확인되기 전에는 공통화하지 않는다.
- 공통화가 필요하면 먼저 feature 내부 중복 제거를 검토한다.
- import는 가능하면 `@/` alias를 사용한다.
- 정적 자산은 `public/`에 둔다.

## 협업 시 리뷰 기준

리뷰할 때는 아래를 우선 본다.

1. 기능 책임이 올바른 폴더에 배치되었는가
2. page/component/action이 과도한 비즈니스 로직을 갖고 있지 않은가
3. 외부 연동 상세가 infrastructure 밖으로 새지 않았는가
4. 환경 변수 접근이 중앙화되어 있는가
5. 문서와 실제 구조가 일치하는가

## 문서 갱신 규칙

아래 변화가 있으면 문서 갱신을 함께 고려한다.

- 새 feature 추가
- 공통 계층 추가 또는 이동
- env 키 추가 또는 변경
- Server Component/Server Action 흐름 변경
- 협업 규칙 변경

최소 수정 대상:

- 루트 `README.md`
- 루트 `AGENTS.md`

필요 시 추가 수정:

- `oss-frontend/README.md`
- `oss-frontend/AGENTS.md`

## 금지에 가까운 패턴

- `app`에 외부 fetch 상세 로직 구현
- Client Component에서 외부 REST API 직접 호출
- Server Action에서 infrastructure를 직접 조립
- feature 전용 코드를 무조건 `shared/`로 이동
- 환경 변수 이름을 파일 여러 곳에서 직접 문자열로 참조
- 구조 설명 없이 큰 폴더 이동 수행
- 문서와 구현을 장기간 불일치 상태로 방치

## 현재 상태 요약

현재 프로젝트에는 아래 기반이 준비되어 있다.

- `src/` 전환형 Next.js 구조
- `config/env.ts` 기반 환경 변수 관리
- `shared/lib/http` 기반 공통 서버 HTTP 계층
- `bootstrap` feature 기반 Server Component 초기 조회 예시
- `VersionInfoPage` Client Component와 `useActionState` 기반 Server Action 갱신 예시
- 개발/운영 `.env` 분리
- `design-tokens/` 기반 컬러 디자인 토큰 파이프라인 (`npm run tokens`)

## 작업 전 체크

이 저장소에서 새 작업을 시작할 때는 가능하면 아래 순서를 따른다.

1. 변경 대상 feature를 정한다.
2. 초기 조회인지 사용자 동작인지 판단한다.
3. 기존 shared/config 계층 재사용 가능성을 확인한다.
4. 구조 변경이 있으면 문서 수정 범위까지 같이 본다.
5. 작업 후 lint/build 또는 최소 검증을 수행한다.
