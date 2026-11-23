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
│   ├── styles/
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

### 6. `src/app/styles/motion.css`는 모션 토큰이다

스프링 이징(`--ease-spring-*`)과 키프레임 애니메이션(`--animate-*`)을 Tailwind `@theme`으로
모은다. 색 토큰과 달리 Figma 내보내기 대상이 아니라 **손으로 관리한다.**

규칙:

- 코드에서는 Tailwind 클래스로 쓴다: `ease-spring-wobbly`, `animate-balance-boing` 등.
- 스프링은 감쇠 진동을 샘플링한 `linear()` 값이다. 새 강도가 필요하면 감쇠비(ζ)만 바꿔
  같은 식으로 뽑는다(파일 상단 주석 참조).
- 움직임은 `motion-safe:`로 감싸 "동작 줄이기" 설정을 존중한다.

### 7. 화면 폭 상한은 480px 한 줄이다

폴드·가로·태블릿 같은 넓은 화면에서도 body가 `--app-max-w`(480px) 폭으로 가운데 선다(`globals.css`).
폭을 `100vw`로 재지 말고 `var(--app-col-w)`를 쓴다. `fixed` 요소는 화면 기준이라 `mx-auto max-w-[var(--app-max-w)]`
또는 `var(--app-gutter)` + 여백으로 줄에 맞춘다(사진 크게 보기 같은 어두운 전체 판은 예외). 넓게 쓰는 화면은 `.app-wide-page`(현재 `/ds`, 약관 `/policies`, 공지 `/notices`).

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

> 아래 예시의 `/version-info` 화면과 그 파일(`version-info-page.tsx`, `load-bootstrap-info-action.ts`, `bootstrap-info-action-state.ts`, `get-bootstrap-info-page-data.ts`)은 #512에서 지웠다. 흐름 설명용으로만 남긴다. 같은 흐름의 실제 코드: 초기 조회는 글 상세(`src/app/community/[id]/page.tsx` → `src/features/community/application/get-post-detail-page-data.ts`), Server Action은 대회 관심(`src/features/competition/presentation/actions/set-competition-interest-action.ts`).

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
- 정적 자산은 `public/`에 둔다. 단, 앱을 켤 때마다 받는 그림은 feature 안 `images/`에 두고 import한다(예: `features/community/presentation/balance/images/`, 주소 표 `balance-character-src.ts`) — 해시 주소(1년 immutable)로 나가 Cloudflare가 원본 서버까지 확인하러 가지 않고, 같은 이름으로 덮어써도 옛 그림이 남지 않는다. `public/images`는 Cloudflare 엣지에 1시간(`next.config.ts` headers), 기기에는 Cloudflare 설정으로 4시간 캐시된다 — 같은 이름으로 바꾸면 최대 약 5시간 옛 그림이 보일 수 있다(#410).

## 웹 무게 규칙

웹은 앱 안의 웹뷰로도 뜬다. 이미지와 움직임이 다시 무거워지지 않게 반영 전에 아래를 지킨다.

**이미지**

- 이미지는 표시 크기의 3배를 넘기지 않고, 압축한 뒤 넣는다.
- 한 장의 상한은 100KB다. 넘으면 `scripts/web-weight-exceptions.json`에 이유를 적는다.
- 코드에서 부르지 않는 이미지는 넣지 않는다. 원본 작업 파일은 `design-assets/`에 둔다.

**움직임**

- `transform`·`opacity`를 우선한다. `width`·`height`·`clip-path`·`filter` 등을 움직이면 예외 파일에 이유를 적는다.
- SVG 안쪽 요소를 움직이지 않는다. SVG 전체가 매 프레임 다시 그려지니, SVG 자체를 움직인다.
- 무한 반복 움직임은 안 보일 때 멈춘다. 예외 파일에 어떻게 멈추는지 적는다.
- 움직임이 있는 화면은 반영 전에 실기기에서 확인한다.

**검사**

- `npm run check:weight`가 상한, 3배(코드에 표시 폭이 적힌 PNG), 안 쓰는 이미지, 무거운 움직임, 무한 반복을 검사한다. PR마다 CI에서도 돈다.
- 예외에 이유가 비어 있으면 실패한다. 필요 없어진 예외는 검사가 알려 주니 지운다.
- 실기기 확인과 자동으로 잡지 못하는 3배 규칙은 PR 양식의 체크 항목으로 확인한다. feature 안에서 import한 그림은 주소가 코드에 없어 3배 검사를 하지 않는다 — 이것도 PR 양식으로 확인한다.

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
- `shared/lib/app-client` 기반 앱 여부 · 앱 버전(#510) — 서버가 요청 User-Agent를 앱(`OSSApp/<버전>`, jiu-jitsu-ios#370) · 브라우저(인앱 브라우저 이름 · `Safari/` · `Firefox/`) · 모름(값을 싣기 전의 앱 · 안드로이드 웹뷰)으로 나눠 앱 · 브라우저로 화면이 갈리는 동적 화면에 깐다(`AppClientHint` — `SessionHintProvider`와 같은 페이지 자리(홈 · 대회 목록 · 내 활동 · 글 · 밸런스 · 대회 상세), 상세 로딩 스켈레톤(loading.tsx)은 자기 Suspense 안에서 따로. 루트 레이아웃에 두면 정적 페이지가 동적으로 바뀌고, 세그먼트 layout에 두면 헤더를 기다리는 동안 상위 loading이 먼저 보일 수 있다). `useIsExternalBrowser`의 첫 렌더는 '브라우저'일 때만 브라우저 화면이고(모름 · 힌트 없음은 지금처럼 앱 기준), 그 뒤는 브릿지 연결로 확정한다. 옛 앱과 맞지 않는 새 동작은 `appVersionAtLeast(useAppVersion(), <최소 버전>)`으로 가르되, 첫 렌더부터 맞아야 하는 화면은 그 페이지에도 힌트를 깐다(없으면 첫 렌더는 버전 모름)
- `shared/lib/analytics` 기반 분석 기록(GA, #575) — 행동 기록은 `track(name, params)` 하나다. 앱 웹뷰는 앱이 지원 목록에 `ANALYTICS_EVENT`를 알릴 때만 브릿지로 넘기고(앱이 GA에 대신 기록, `surface`=webview — jiu-jitsu-ios#424), WEBVIEW_READY 전 기록은 모았다가 직후에 보낸다. 앱 밖 브라우저는 GA 웹 태그(`window.gtag`)로 — 태그 준비 전 기록은 모았다가 보내고, 태그가 없기로 정해지면(앱 안 웹뷰 · 측정 ID 없음) 버린다. 꼬리표는 문자열 · 정수만(참거짓은 "true"/"false", 빈 값은 빠짐), 닉네임 · 글 · 자유 입력 · 검색어 원문은 싣지 않는다. 화면 기록(`screen_view`, #576)은 `src/instrumentation-client.ts`가 문서 로드 · 라우터 이동마다 주소를 화면 이름(`screens.ts`, 사전 값)으로 바꿔 한 번 알리고(같은 경로 · 화면 · section이면 다시 안 알림 — 쿼리만 바뀐 경우, 대회 달력은 목록 화면이 `reportScreen`으로), 앱에서는 언제 셀지 앱(jiu-jitsu-ios#425)이 정한다 — 브라우저만 웹이 1초 넘게 보일 때 보낸다. 여는 함수(`useOpen*` · `CompetitionDetailLink`)는 `entryPath`로 들어온 길(`from`, 사전 값 `ScreenFrom`, 주지 않으면 지금 화면 이름)을 넘긴다 — 앱은 지원 목록에 `ANALYTICS_EVENT`가 있을 때만 주소에 `?from=`(그 전 앱은 상세 주소를 쿼리까지 비교해 같은 글 푸시를 알아본다), 브라우저는 주소에 싣지 않고 메모리로. 앱 웹뷰가 같은 화면을 다시 불러온 문서(당겨서 새로고침 · 같은 글 푸시 · 다시 시도)는 알리지 않는다(웹뷰마다 마지막 알림을 sessionStorage에 두고 비교). 같은 웹뷰 이동의 입구는 `setNextScreenFrom`. 글 수정의 `from=post_detail`은 성공 뒤 원래 상세로 돌아가는 표시도 겸한다. 앱 밖 브라우저(브릿지가 없고 User-Agent가 브라우저로 확실할 때 — 인앱 브라우저 · `Safari/` · `Firefox/`)는 GA 웹 태그(`web-tag.ts`, #579)를 띄운다 — 측정 ID는 서버 env `GA_MEASUREMENT_ID`를 `/api/analytics/config`로 받고(정적 페이지를 동적으로 바꾸지 않으려고 레이아웃에서 읽지 않음), 없으면 태그 없이 기록을 버린다. 자동 페이지 조회는 끄고 page_title은 화면 이름. 공유 주소에는 `utm_source`(system_sheet · native_sheet · copy_link) · `utm_medium=share` · `utm_campaign`(post · balance_game · competition)을 붙이고 `share`를, '앱으로 보기' · '앱에서 계속하기'는 결과(app_opened · store_redirect)가 정해질 때 `open_app_click`을 남긴다. 로그인 안내(#577)는 이유를 사전 코드(`LoginPromptReason`, native-bridge `messages.ts`의 닫힌 목록)로 늘 싣는다 — `requireAuth` · `promptLogin` · `useLoginGuard().guard(action, reason, message)` · 401 뒤 `requestNativeLogin(reason)`. 앱은 `AUTH_LOGIN_PROMPT`의 reason으로 `login_prompt_view`를 기록하고(jiu-jitsu-ios#426), 브라우저는 "앱에서 계속할 수 있어요" 창이 reason과 함께 열릴 때 웹이 `login_prompt_view {reason, from=지금 화면 이름}`을 남긴다. 글 · 댓글 기록(#619): 여는 함수 셋(글 · 밸런스 · 대회)이 열 때 `select_content`를 남기고(목록 순번 · 알림 종류 · 안 읽음은 부르는 쪽이 `detail`로, 여는 함수를 거치지 않는 밸런스 마감 토스트의 '오늘의 밸런스 게임 보기'는 그 자리에서 `trackSelectContent`), 무한 스크롤 · 댓글 · 대댓글 더보기는 받은 묶음이 목록에 붙을 때 `list_load_more {page}`(첫 묶음 = 1). 사진은 한 번 고른 묶음의 장이 모두 끝날 때 `photo_attach` 한 번(✕로 지운 장은 빼고, 앱 사진 선택에서 못 받은 장은 실패로 셈). 글쓰기 · 수정은 그 화면의 입구(`currentScreenFrom()` — 화면 기록이 정한 from)를 싣고, 카테고리는 이름으로 사전 값(`features/community/presentation/post-analytics.ts`, 모르면 `cat_{id}`), 본문은 길이 구간만, 대회 id는 `comp_45` 형식이다. `category` · `competition_id`를 싣는 다른 이벤트(카테고리 탭 · 글 상세 카테고리 이름 · 주제 배너 · 대회 글 필터 · 대회 이야기 "모두 보기")도 같은 형식(`categoryParam` · `contentIdOf`, 전체 탭은 `all`, #622). 등록 · 수정 · 삭제 · 댓글 기록은 서버 성공 뒤에만. 알림 기록(#578, `content-alert.ts`): 알림함 "모두 읽음" 저장 성공에 `notification_read_all`, 알림 종을 켜고 끈 저장 성공에 `content_alert_toggle {content_type, state, from, competition_id}` — 글 · 밸런스 게임 상세 종(서버가 돌려준 상태, from `post_detail` · `balance_detail`), 대회 상세 종(`alert_bell`), 마감 알림 시트 '알림 받기'(연 곳으로 — 첫 관심 뒤 `interest_sheet` · 종 `alert_bell`), 알림함 "이 대회 알림 받지 않기"(`notification`). 대회는 실제로 알림이 가는 상태가 바뀔 때만 세서, 설정이 꺼진 채 종을 누르면 시트의 '알림 받기'가 성공할 때 남고 '나중에'는 남지 않는다. 대회 기록(#620)은 `features/competition/presentation/competition-analytics.ts`에 모은다 — 필터(누르는 순간, 지역은 시트 '적용' · 지역 값은 주소 쿼리와 같은 소문자 코드, 빈 목록 '필터 지우기'는 켜져 있던 필터마다 off) · 목록 ↔ 달력 · 달 이동 · 날짜 칸, 배너(`banner_view`는 보인 뒤 600ms · screen_view가 다시 세는 때에 맞춰 — 같은 화면에서 다시 그려지면 안 세고, 다시 붙거나(뒤로 가기 · 목록 ↔ 달력) 이 화면에서 연 대회 상세에서 돌아와 다시 보이면 다시 셈. 앱을 내렸다 올림 · 탭 전환은 안 셈(앱이 대회 탭 웹뷰를 투명하게만 숨김), 곧 열려요는 사전 `opening`), 관심(`useCompetitionInterest().toggle(target, { from })` — 서버 성공 뒤에만, 단계 `reg_status`는 상세 상태 `detailStatusOn` 기준(목록 · 글 카드는 훅에 `today`를 넘기고 상세는 단계를 직접 넘김), 상세 요약 알약 `competition_detail` · 바닥 바 하트 `competition_bar` · 머리 알림 종이 관심까지 등록하면 `alert_bell`), 상세 바깥 링크(`CompetitionExternalLink` — 바 상태 링크 · 바 '대회사 사이트'(organizer_site) · 정보 기준 줄 '대회 공지'(notice), from은 상세에 들어온 처음 입구 — 브라우저 뒤로 가기(from=back) 뒤에도 처음 값), 정보 제보(서버 성공 뒤, 항목 코드만). 반응 · 신고 · 차단 기록(#580)은 `features/community/presentation/reaction-analytics.ts`에 모은다 — 모두 서버 성공(신고는 이미 신고함 포함) 뒤에만, 좋아요 · 저장은 성공한 토글 요청마다(연타 루프 안, from은 누른 순간의 화면 `currentScreenName()`), 숨기기 · 신고 · 차단의 from은 누른 메뉴(feed_menu · post_menu · comment_menu, 신고 뒤 [차단]은 신고한 메뉴 — 상세에서 닫힌 뒤 목록 토스트의 되돌리기 · [차단]은 목록이 post_menu로), 차단 해제는 blocked_list, 숨김을 푼 것(되돌리기 · 이미 숨긴 글 다시 누름)은 action=undo, 신고 사유는 서버 코드 소문자 8개(jiu-jitsu-ios#428과 같음), 댓글 id는 `cmt_N`. 밸런스 투표 기록(#581, `balance/balance-analytics.ts`)은 `useBalanceVote`가 서버에 남은 투표 요청마다(연타 루프 안) `balance_vote {game_id(bg_N), choice, action, from}`을 남긴다 — action은 응답의 투표 후 선택으로(없으면 cancel, 화면의 이전 선택이 없으면 vote, 있으면 change), choice는 보낸 선택지(취소면 취소한 선택지), from은 호출부가 넘김(홈 카드 balance_card · 상세 balance_detail), 체험 투표(`?sample=1`)는 남기지 않는다. 오류 · 속도 기록(#583, `error-shown.ts` · `web-vitals.tsx`): 사용자에게 오류가 보일 때 `error_shown {error_type, error_code, field, content_type}` — error 토스트는 ToastProvider가 띄울 때마다(부르는 쪽은 아는 만큼 `toast.show(msg, { tone, error })`로 응답 상태 · 서버 코드 · 칸을 싣고, error가 아닌 모양이라도 `error`를 넘기면 셈 — 글쓰기 입력 검사 안내 · 사진 못 올림. 업로드 첫 실패의 썸네일 ↻처럼 문구가 없는 표시는 세지 않음), 오류 화면(`FallbackScreen`의 `errorShown` · `FeedErrorState` · `DetailErrorState`)은 붙을 때 한 번, 바로 닫히는 상세(지운 글 · 끝난 밸런스 게임)는 not_found를 남기고 닫기를 WEBVIEW_READY 뒤로 미뤄 기록이 먼저 앱에 가게 한다. 종류는 넘긴 type → 상태 · 코드(504 = 웹 시간 초과 → `error_code=TIMEOUT`, 404 · C0002 = not_found, 401 · 403 = forbidden, C0015 · 400 · 422 = validation, 5xx = server) → 오프라인이면 network → unknown. 더 불러오기 실패(`FeedLoadMoreError`) · 대회 달력의 달 받기 실패도 보일 때 한 번. 안내 문구 원문은 싣지 않는다. 루트 레이아웃의 `WebVitalsReporter`가 `useReportWebVitals`로 `web_vital {metric(lcp · inp · cls · fcp · ttfb), rating(good · needs_improvement · poor), metric_value(밀리초, CLS는 1000배)}`. 대회 목록도 PAGE_READY를 보낸다(홈 피드와 같이 만료 복구 외 모든 분기 — 앱 `screen_load` 기준, jiu-jitsu-ios#431). 이름 없는 누름(#584, `ui-click.ts`): 이름 붙은 기록이 나지 않는 버튼 · 탭 · ⋯ 메뉴 항목(`MenuItem ga`) · 칩 · 빈 화면 버튼(`EmptyState` action.ga) · 바닥 바 댓글(`ReactionBarButton ga`)에 `data-ga="요소"`(소문자 snake_case)만 달면, `instrumentation-client`가 설치한 document capture 위임이 `ui_click {element: "지금 화면 이름.요소"}`를 남긴다(화면을 모르는 주소는 버림). 좋아요 · 공유 · 필터처럼 이름 붙은 기록이 나는 버튼(글쓰기 뒤로 = `post_write_cancel`), 글 · 대회를 여는 카드, 글쓰기를 여는 버튼, 밸런스 투표, 시트 안에서 고르는 항목(지역 · 대회 고르기)에는 달지 않는다. 안내 시트 · 창의 '나중에' · 닫기는 단다.
- `shared/lib/time` + `shared/ui/server-clock` 기반 공통 시간 표기 (서버 날짜는 타임존 없는 KST → infrastructure에서 `toKstIso`로 정규화, 시간을 그리는 페이지는 `ServerClockProvider`로 감싼다)
- `bootstrap` feature 기반 Server Component 초기 조회 예시
- `competition` feature — 대회 탭 목록(`/competition`)과 위에 붙는 한 줄 필터 줄(왼쪽 끝에 스크롤 따라 바뀌는 지금 달 · 지역 · 접수 중, 거르기는 서버(`GET /competitions`의 region·status·interested, domain `competitionListQueryOf`)가 하고 화면이 Server Action `load-competition-list-action.ts`로 첫 페이지·다음 페이지(`nextCursor`)·달력 한 달(`date=월초&size=100`)을 받는다. 지역 시트는 공개 대회(지난 대회 포함)가 있는 시·도만 고를 수 있다(`GET /competitions/regions`, backend#206 — 화면 데이터가 같이 읽고 못 받으면 17개 모두, 이미 고른 지역은 목록에서 빠져도 뺄 수 있다). 필터 첫 페이지(오늘 기준)가 비고 `previousCursor`가 있으면 바로 앞 페이지(가장 최근 지난 대회)를 대신 보여 준다 — 지난 대회만 있는 지역. 첫 달의 목록 속 달 머리는 감춘다), 줄마다 관심 등록 버튼·익명 관심 수(목록 항목의 `interestCount`·`interested`, 등록·해제는 `presentation/actions`의 Server Action → `PUT|DELETE /competitions/{id}/interest`, 처음이면 마감 알림 시트), 목록 항목의 `popular`(서버가 같은 달 안의 관심 수 순위로 정함, 없으면 false — 관심을 눌러도 다시 받기 전까지 그대로)가 true면 '관심 많은 대회' 꼬리표(불꽃과 HOT 글자가 한 자리에서 번갈아 나오는 `HotMark`), 관심만 보기(하트)·목록 ↔ 달력 전환은 필터 줄 오른쪽 끝(#396 — 아래 목록을 바꾸는 도구라 칩과 같은 줄, 앱 머리의 알림함은 다른 화면 입구라 따로)(대회 이름 검색은 `COMPETITION_SEARCH_ENABLED`로 당분간 숨김)(달력은 `competition-calendar.tsx`, 같은 필터·같은 대회 줄을 쓰고 관심 대회 날은 빨간 점. 앞 달 묶음에 이 달이 끝까지 들어 있으면 다시 받지 않고, 받는 중엔 '대회를 찾는 중…' — #546)(고른 필터·목록/달력·달력에서 보던 달은 주소 쿼리 `region`·`open`·`interest`·`view`·`month`에 replace로 담고 서버가 그 조건으로 처음부터 그린다 — 당겨서 새로고침해도 그대로, 이름 검색어는 담지 않음, domain `competition-list-view-state.ts`, #539)(목록·달력 끝 여백은 홈 피드와 같은 `shared/ui/tab-bar-clearance.ts`, #487), 필터 줄 아래 곧 마감 배너(목록 보기에서만. 접수 마감이 7일 안인 관심 대회 중 가장 급한 한 장, 고르기는 domain `deadlineSoonInterested`. ✕로 닫으면 이 기기 localStorage에 기억하고 다음 대회를 띄운다. 후보를 다 닫으면 첫 대회 카드 뒤 오른쪽에 내 띠 캐릭터가 남고, 누르면 닫은 기록을 지워 배너를 다시 띄운다(`DeadlineBannerReopen`). 카드 왼쪽 위로 내 띠 캐릭터가 머리를 내민다. 배너가 보일 때만 화면 위에 띠 색 그라데이션을 깔고, 그 맨 윗색을 브릿지 `COMPETITION_HEADER_TINT`로 앱에 보내 앱의 '대회' 머리도 같은 색으로 칠한다 — 띠는 서버가 커뮤니티 프로필에서 `load-my-belt-rank.ts`로 1초만 기다려 읽고, 못 받았으면 화면이 `use-my-belt-rank.ts`로 한 번 더 읽는다(만료 토큰은 앱에 갱신을 맡김). 띠가 없으면 흰띠, 그림은 `public/images/characters/stand`), 같은 자리의 곧 열려요 배너(관심 대회 중 대회 날이 7일 안이고 끝나지 않은 대회, 접수 상태 무관 — 접수 마감 대회가 핵심. 같은 대회의 곧 마감이 있으면 그게 먼저, 고르기는 domain `eventSoonInterested`, 모양은 곧 마감과 같고 문구만 '관심 대회가 곧 열려요'. 닫은 기록은 대회 + event + 대회 날짜. 대기열은 곧 마감 → 곧 열려요 → 결과 남기기), 같은 자리의 결과 남기기 카드(#403 — 관심 대회가 끝난 뒤 5일(토요일 대회는 그 주 금요일)까지, 같은 주말에 끝난 대회는 한 장으로 묶음, 고르기는 domain `competition-result-prompt.ts`. 곧 마감 배너가 있으면 그게 먼저. 닫은 기록은 대회 상세의 결과 남기기 배너와 `competition-result-dismissed.ts`로 함께 쓴다. 이미 내 대회 기록(커뮤니티 프로필 `competitions[].competitionId`)에 남긴 대회는 상세 배너·탭 카드 모두 서버가 빼고, 앱이 브릿지 `COMPETITION_RECORD_SAVED`(또는 `PROFILE_UPDATED`)를 보내면 떠 있는 배너·카드를 바로 닫고 BFF `GET /api/community/profile/competitions`로 다시 확인한다 — #545). 상세 화면 아래에 붙은 상태 버튼 바(#469 · #470, `competition-entry-links.tsx`, 셸 안 sticky)는 지금 단계에 맞는 접수 사이트 링크(신청 · 참가자 현황 · 대진표 · 실시간 매트 · 결과)를 두 개까지 새 창으로 열고(고르기는 domain `competition-entry-link.ts`의 `entryLinksOn`, 도장 신청 대회(`clubRegistrationOnly`)는 신청 숨김. 여러 날 대회는 `endDate`까지 당일로 본다), 없으면 같은 자리에 대회 공지로 가는 "대회사 사이트에서 확인하기"를 둔다(바가 있으면 관심 버튼은 바 왼쪽 하트로 옮기고 요약 줄엔 관심 수만 글자로 둔다) — 상세 응답의 `links` · `registrationSite` · `clubRegistrationOnly` · `endDate`(backend#227)를 쓴다. 대회 공지 링크는 정보 기준 줄의 "○○ 대회 공지 기준이에요" 문장 안에 있다(#471). 대회 API(backend#193)는 infrastructure `external-competition-*-repository.ts`가 부르고, 응답 모양·enum 매핑은 `competition-dto.ts`가 맡는다(id는 숫자 `competitionId`, 남은 날·상태는 응답의 `today`·`status` 기준). 대회 API가 없는 백엔드를 바라보는 배포는 서버 전용 env `COMPETITION_ENABLED`(비어 있으면 켜짐, "false"일 때만 꺼짐 — 앱이 대회 탭을 늘 띄워서(#502), `application/is-competition-enabled.ts`)를 `false`로 꺼 둔다 — 끄면 대회 탭·상세 404, 피드·글 상세 대회 카드·글쓰기 대회 고르기·알림함 대회 줄·유니버설 링크 `/competition/*`가 빠지고 대회 Server Action은 실패로 돌려준다
- `competition` 대회 상세(`/competition/[id]`) — 목록·달력의 대회 줄을 누르면 열린다(앱은 `OPEN_SUBVIEW`). 상태·가장 가까운 마감(domain `competition-schedule.ts`), 관심 등록·조회수, 기본 정보·일정·참가비(`competition-fee.ts`), 정보 기준과 '정보가 달라요' 제보(Server Action), 대회 이야기(이 대회를 고른 글 최대 5개, `competition-story.ts`), 끝난 대회의 결과 남기기 배너(앱에 `OPEN_COMPETITION_RECORD`), 공유 미리보기 메타데이터와 유니버설 링크(`/competition/*`). 화면 데이터는 `get-competition-detail-page-data.ts`(상세 조회는 조회수를 올리지 않고, 조회수는 화면이 마운트 때 `record-competition-view-action.ts`로 한 번 센다). 참가비 0원은 '무료'. 제보는 모든 항목에 맞는 정보 입력칸('다른 정보'만 필수), 같은 항목 하루 3번 넘으면(R0010) 토스트. 글쓰기는 '대회' 카테고리에서 대회를 고르고(`competition-picker.tsx`, `GET /competitions/picker` · 이름 검색은 서버), 고른 대회는 글 저장(`POST /board`·`PUT /board/{id}`)의 `competitionId`로 함께 보낸다 — 수정은 글 상세의 `competitionId`를 늘 다시 보낸다(생략·null이면 연결이 풀린다)
- `competition` 관심 대회 마감 알림 — 첫 관심 등록 때 '이 대회 마감 알림을 받을까요?' 시트(`competition-alert-sheet.tsx`, 남은 마감 전날은 domain `competition-alert.ts` — 서버가 매일 18시(KST)에 한 번 보내므로 오늘 알림은 시트를 여는 순간의 서버 시각이 18시 전일 때만 보이고, 그 뒤라 남은 알림이 없으면 시트 대신 토스트·대회 상세 종도 숨김(#548, `DEADLINE_ALERT_SEND_HOUR`), 설정 `competitionEnabled`·`competitionNoticeAsked`가 둘 다 false일 때만 뜨고, 답은 '나중에'까지 `PUT /notice/setting/competition`으로 남긴다. '알림 받기'가 성공하면 묻던 대회가 없어도 앱에 `COMPETITION_ALERTS_ENABLED`(대회 id는 숫자 문자열 — 이미 깔린 앱은 문자열만 받는다)), 대회 상세 앱바의 이 대회 알림 종(상세의 `noticeEnabled`, 켜기 `PUT /competitions/{id}/notice`는 관심도 함께 등록·끄기 `DELETE`는 관심 유지. 설정이 이미 켜진 채 켜면 시트 없이 앱에 `COMPETITION_ALERTS_ENABLED {competitionId}` — 앱이 기기 알림 상태를 보고 안내, #541. 설정이 켜진 채 관심 등록할 때도 보낸다. 앱이 capability로 이 메시지를 알리면 `requestId`를 실어 `COMPETITION_ALERTS_RESULT {deviceEnabled}`를 기다린 뒤 토스트를 정한다 — 켜짐이면 성공 토스트, 꺼짐이면 매번 '기기 알림이 꺼져 있어 알림이 오지 않아요', 답이 없으면 없음. 브라우저 · 옛 앱은 바로 성공 토스트. `CompetitionAlertProvider.confirmEnabled`. 글 · 밸런스 게임 상세의 알림 종도 켤 때 앱이 capability로 `CONTENT_ALERTS_ENABLED`를 알리면 같은 방식 — `CONTENT_ALERTS_RESULT`를 기다려 토스트, 옛 앱에는 보내지 않음, #633 `notice-bell.ts` `announceNoticeBell`), 알림함에 서버가 섞어 주는 대회 마감 알림(`COMPETITION_DETAIL` → 상세, `deletedStatus COMPETITION`이면 이동 없이 토스트)·'이 대회 알림 받지 않기'. 설정·첫 시트는 `CompetitionAlertProvider`가 감싼 화면(대회 탭·대회 상세·홈 피드·글 상세·알림함)에서만 뜬다. 웹은 `POST /notice/setting`을 쓰지 않는다(보내지 않은 칸을 null로 덮는다)
- 글 속 대회 카드 — '대회' 글이 고른 대회를 피드 카드·글 상세 본문 아래에 대회 탭 줄 그대로(`post-competition-card.tsx`) 보여 준다. 누르면 대회 상세, 끝난 대회는 '종료'. 카드는 글 목록·상세 응답의 `competition`(없으면 숨김)이고, 대회 이야기는 `GET /competitions/{id}/stories`(서버 순서). 이야기가 없을 때 "커뮤니티에서 첫 글 남기기"는 글쓰기를 `/community/write?competitionId=<id>`로 열어 '대회' 카테고리와 그 대회를 미리 골라 둔다(#433, `useOpenPostWrite({ competitionId })` · `getCompetitionPickerForWrite` — 고르기 목록 밖이면 상세로 채우고, 숫자가 아니거나 못 읽거나 대회 화면이 꺼졌으면 빈 글쓰기). 글쓰기에서 돌아오면 상세가 다시 읽어 새 글이 보인다
- 회원 차단 — 댓글 ⋮ 차단은 BFF `POST /api/community/users/{id}/block` → `BlockUserUseCase`가 업스트림 토글(`POST /user/block/{id}`) 결과가 해제면 한 번 더 토글해 차단으로 돌려놓고(backend#232 전까지), 화면은 응답 `blocked`가 true일 때만 "유저를 차단했어요". 앱이 차단·해제 뒤 `USER_BLOCK_CHANGED`를 보내면 `BlockChangeWatcher`(layout)가 — 가려진 웹뷰는 다시 보일 때 한 번만 — `useOnBlockChange`로 알리고, 상세는 댓글 목록(`CommentList`)이 `router.refresh()`, 피드는 `reloadLoaded`로 불러온 페이지를 다시 읽어 목록을 통째로 바꾼다(#488). 홈은 서버 렌더가 실패하면 오류 화면을 그려 일괄 refresh는 하지 않는다. 해제(설정 > 차단한 회원)는 `DELETE`
- '앱으로 보기' 링크 (`shared/lib/app-link.ts`, `use-open-in-app-href.ts`) — iPhone · 그 밖은 `bjjossapp://open?url=` + 2초 뒤 App Store, 안드로이드(User-Agent `Android`)는 Play 스토어 앱 페이지(패키지 `kr.bjj_oss`, #520 — 안드로이드 앱에 브라우저에서 열 수 있는 곳(BROWSABLE)이 없어 `intent:`로도 열리지 않는다). 하이드레이션 전 탭은 App Store
- 브라우저 막다른 화면 (#518) — 공유 링크로 연 브라우저에서: 지워진 글은 배너 + 안내 + "다른 글 보러 가기"(홈, 앱은 지금처럼 닫고 목록 토스트 — `PostDetailGone`), 남의 작성자는 "앱에서 계속하기" 안내(`useOpenAuthorProfile` — 상세 · 댓글 · 피드 카드), 홈 · 홈 로딩 맨 위에 '앱으로 보기' 배너(`HomeOpenInAppBanner`), 홈 공유 미리보기는 기본 카드 이미지(`app/page.tsx` generateMetadata)
- 없음 · 오류 화면 — `app/not-found.tsx` · `error.tsx` · `global-error.tsx`와 없는 대회(`CompetitionDetailGone`, 200) · 글 수정 불러오기 실패(`PostEditLoadFailed`, 없는 글만 `notFound()`)가 공용 `shared/ui/fallback-screen.tsx`를 쓴다. 앱 서브뷰는 닫기, 앱 탭 첫 화면(`/` · `/competition`)은 다시 시도, 브라우저는 홈(대회는 대회 목록)으로. PAGE_READY는 보내지 않는다(#503). 글 · 밸런스 상세의 없는 글은 지금처럼 자동으로 닫고 돌아간 목록이 토스트
- 고객 지원 `/support` (#505) — App Store Connect 지원 URL. 로그인 없이 열리는 정적 페이지로 정책 문서 부품(`features/policies/presentation/policy-document.tsx`)을 쓴다. 문의 메일은 앱 `SupportContact.email`(설정 › 문의하기 · 관장 인증 문의)과 같은 주소로 두고, 계정 삭제 문장은 앱 탈퇴 확인창 · 서버 30일 유예와 맞춘다
- `announcements` feature — 공지사항 `/notices` 목록(최신순 20개씩, `?page=`) · `/notices/[id]` 상세(#509). 공지 API(backend#274, 비로그인, 없거나 게시 전 404 C0015)를 요청마다 읽는다(예약 공지). 알림함(`community/notifications`)과 별개. 약관 화면과 같은 모양이고 앱은 설정 › 공지사항이 약관 웹뷰로 엶(jiu-jitsu-ios#369 — 앱 머리 · 쓸어서 뒤로가 없어 상세 위에 '공지 목록' 링크). 본문은 평문, 주소는 글 본문과 같은 `splitLinks`로 새 창 링크
- `community` 글 검색(`/community/search?q=`, 앱 홈 검색 버튼이 서브뷰로 엶) — 검색 규칙 · 찾은 말 자리는 domain `post-search.ts`, 첫 페이지는 Server Component(주소에 검색어가 있을 때) 또는 BFF `GET /api/community/board?boardListType=SEARCH`, 결과는 피드 목록(`CommunityFeedList`)에 `highlightWords`, 최근 검색은 이 기기 localStorage(`presentation/search`)
- `VersionInfoPage` Client Component와 `useActionState` 기반 Server Action 갱신 예시
- 개발/운영 `.env` 분리
- `design-tokens/` 기반 컬러 디자인 토큰 파이프라인 (`npm run tokens`)
- 화면 폭 상한 480px 한 줄(`globals.css`의 `--app-max-w`) — 넓은 화면에선 가운데 폰 폭, 폰에선 그대로
- `design-system` feature — `/ds` 디자인 시스템 문서(로컬·개발 서버에서만, `is-design-system-page-enabled.ts`). 문서 목록·순서는 `presentation/doc-kit/doc-registry.ts`, 문서 틀(머리·견본 판·표·좋은 예/피할 것·실측)은 `doc-kit/`, 문서 내용은 `docs/`(기초·부품·패턴 한 장씩). 새 공용 부품을 만들면 여기에도 한 장 더한다

## 작업 전 체크

이 저장소에서 새 작업을 시작할 때는 가능하면 아래 순서를 따른다.

1. 변경 대상 feature를 정한다.
2. 초기 조회인지 사용자 동작인지 판단한다.
3. 기존 shared/config 계층 재사용 가능성을 확인한다.
4. 구조 변경이 있으면 문서 수정 범위까지 같이 본다.
5. 작업 후 lint/build 또는 최소 검증을 수행한다.
