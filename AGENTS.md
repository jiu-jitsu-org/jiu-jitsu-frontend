# Jiu-Jitsu-Frontend AGENTS Guide

## 목적

이 문서는 이 저장소에서 작업하는 사람이 프로젝트 구조와 작업 기준을 빠르게 이해하도록 돕기 위한 운영 문서다.  
특히 아래 목적에 맞춰 작성한다.

1. 여러 개발자가 구조를 동일하게 이해하도록 돕기
2. 기능 추가 시 어디에 무엇을 넣어야 하는지 빠르게 판단하게 하기
3. BFF와 Clean Architecture 규칙이 작업 중 무너지지 않게 하기

## 프로젝트 성격

이 저장소는 `Next.js + React + BFF` 기반 프로젝트다.  
실제 애플리케이션 루트는 `oss-frontend/`다.

핵심 목표:

1. Git 기반 협업에 유리한 구조 유지
2. React Web 페이지와 REST API(BFF)의 통합 운영
3. Clean Architecture 기반 확장성 확보

## 문서 우선순위

작업 중 문서를 해석할 때는 아래 우선순위를 따른다.

1. 실제 코드 구조
2. 이 루트 `AGENTS.md`
3. 루트 `README.md`
4. `oss-frontend/AGENTS.md`
5. `oss-frontend/README.md`

문서의 구조와 성격을 분석하여 코드를 수정한다.

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
    ├── public/
    ├── src/
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
```

## 작업 기준이 되는 실제 앱 구조

```txt
oss-frontend/src/
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── config/
├── features/
├── shared/
└── ...
```

## 핵심 구조 원칙

### 1. `app/`은 엔트리다

`src/app`은 Next.js 라우팅과 BFF 진입점만 관리한다.

여기에 두는 것:

- page
- layout
- loading
- error
- route handler

여기에 두지 않는 것:

- 기능별 핵심 비즈니스 로직
- 외부 API 세부 구현
- 재사용 가능한 도메인 규칙

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
  화면, 컴포넌트, hooks, 뷰 관련 코드
- `application`
  유스케이스, 흐름 조합, 서비스 레벨 로직
- `domain`
  모델, 인터페이스, 규칙, 계약
- `infrastructure`
  외부 API, DB, 저장소 구현

### 3. `shared/`는 공통 코드만 둔다

`shared`는 여러 기능이 함께 쓸 때만 사용한다.

좋은 예:

- 공통 HTTP 클라이언트
- 공통 에러 타입
- 공통 API 응답 타입

나쁜 예:

- 아직 한 기능에서만 쓰는 코드
- 편해서 일단 넣어두는 기능 전용 유틸

### 4. `config/`는 환경과 설정을 모은다

환경 변수 접근, 앱 상수, 런타임 설정은 `src/config`에서 중앙 관리한다.

현재 기준:

- `src/config/env.ts`

직접 `process.env`를 여러 파일에서 읽기보다 `config`를 통해 읽는 방식을 우선한다.

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

## BFF 규칙

외부 API 호출은 가능하면 브라우저가 직접 하지 않고 BFF를 경유한다.

표준 흐름:

```txt
Browser
  -> src/app/api/<feature>/route.ts
  -> src/features/<feature>/application/*
  -> src/features/<feature>/infrastructure/*
  -> src/shared/lib/http/*
  -> External API
```

이 방식을 우선하는 이유:

- 외부 Base URL 숨김
- 인증/헤더 제어 용이
- 에러 응답 표준화 가능
- 향후 로깅, 모니터링, 캐싱 추가 용이

## 현재 구현된 예시

현재 기준 대표 예시는 `bootstrap info` BFF다.

외부 API:

```txt
GET https://api.developer-chanq.xyz/api/bootstrap/info?osName=ANDROID
```

내부 BFF:

```txt
GET /api/bootstrap/info?osName=ANDROID
```

파일 흐름:

```txt
src/app/api/bootstrap/info/route.ts
  -> GetBootstrapInfoUseCase
  -> ExternalBootstrapRepository
  -> HttpClient
```

이 예시는 이후 새 API 작업의 기준 템플릿으로 본다.

## 새 API 추가 규칙

새 API를 추가할 때는 아래 질문부터 판단한다.

1. 이 API는 어느 feature에 속하는가
2. 브라우저가 직접 호출해야 하는가, 아니면 BFF로 감싸야 하는가
3. 공통 HTTP 계층을 재사용할 수 있는가
4. 응답 모델을 domain에 둘 만큼 의미 있는가

권장 순서:

1. `domain`에 request/response 의미와 repository interface 정의
2. `application`에 use case 작성
3. `infrastructure`에 실제 외부 API 구현 작성
4. `app/api`에 route handler 추가
5. 필요하면 `presentation`에 UI 연결

예시:

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

## 환경 변수 규칙

환경 변수 파일은 `oss-frontend/` 루트에 둔다.

사용 파일:

- `.env.development`
- `.env.production`
- `.env.example`

현재 기준 주요 값:

```env
API_BASE_URL=https://api.developer-chanq.xyz
API_TIMEOUT_MS=10000
```

규칙:

- 브라우저에 필요 없는 값은 `NEXT_PUBLIC_`를 붙이지 않는다.
- 서버 전용 값은 `src/config/env.ts`에서 읽는다.
- 새 환경 변수를 추가하면 `.env.example`도 같이 갱신한다.

## 구현 시 지켜야 할 실무 원칙

- route handler는 최대한 얇게 유지한다.
- fetch 상세 로직은 feature infrastructure나 shared http layer로 내린다.
- 비즈니스 로직을 page나 route에 직접 쌓지 않는다.
- 재사용이 확인되기 전에는 공통화하지 않는다.
- 공통화가 필요하면 먼저 feature 내부 중복 제거를 검토한다.
- import는 가능하면 `@/` alias를 사용한다.
- 정적 자산은 `public/`에 둔다.

## 협업 시 리뷰 기준

리뷰할 때는 아래를 우선 본다.

1. 기능 책임이 올바른 폴더에 배치되었는가
2. route가 너무 많은 비즈니스 로직을 가지고 있지 않은가
3. 공통 코드가 과도하게 비대해지지 않았는가
4. 환경 변수 접근이 중앙화되어 있는가
5. 문서와 실제 구조가 일치하는가

## 문서 갱신 규칙

아래 변화가 있으면 문서 갱신을 함께 고려한다.

- 새 feature 추가
- 공통 계층 추가 또는 이동
- env 키 추가 또는 변경
- API 생성 패턴 변경
- 협업 규칙 변경

최소 수정 대상:

- 루트 `README.md`
- 루트 `AGENTS.md`

필요 시 추가 수정:

- `oss-frontend/README.md`
- `oss-frontend/AGENTS.md`

## 금지에 가까운 패턴

- `app/api`에서 직접 복잡한 fetch 로직 구현
- feature 전용 코드를 무조건 `shared/`로 이동
- 환경 변수 이름을 파일 여러 곳에서 직접 문자열로 참조
- 구조 설명 없이 큰 폴더 이동 수행
- 문서와 구현을 장기간 불일치 상태로 방치

## 현재 상태 요약

현재 프로젝트에는 아래 기반이 이미 준비되어 있다.

- `src/` 전환형 Next.js 구조
- `config/env.ts` 기반 환경 변수 관리
- `shared/lib/http` 기반 공통 서버 HTTP 계층
- `bootstrap` feature 기반 BFF 예시
- 개발/운영 `.env` 분리
- lint, build, 실제 BFF 호출 검증 완료

## 작업 전 체크

이 저장소에서 새 작업을 시작할 때는 가능하면 아래 순서를 따른다.

1. 변경 대상 feature를 정한다.
2. 기존 shared/config 계층 재사용 가능성을 확인한다.
3. API라면 BFF가 필요한지 먼저 판단한다.
4. 구조 변경이 있으면 문서 수정 범위까지 같이 본다.
5. 작업 후 lint/build 또는 최소 검증을 수행한다.
