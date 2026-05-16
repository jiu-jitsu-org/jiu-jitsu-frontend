# OSS-Frontend Coding Convention

## Notice!!!!
260516 - 임시 초안 문서임을 강조 합니다.

260516 - @SuniDev

1) Prettier 도입코드 외형(따옴표·들여쓰기·줄바꿈·세미콜론·줄 길이)을 자동으로 통일해주는 포매터.

2) import 순서 규칙
import 문의 그룹·정렬 순서 규칙 (예: react → next → 외부 라이브러리 → @/ → 상대경로).

3) 파일/폴더 네이밍
파일명·폴더명·변수·타입의 케이스 규칙 (kebab-case, camelCase, PascalCase 등).

4) "use client" 사용 기준
Next.js App Router에서 컴포넌트를 클라이언트 컴포넌트로 만들겠다고 선언하는 지시자. 안 붙이면 기본은 서버 컴포넌트.


## 목적 🎯

이 문서는 `oss-frontend` 프로젝트에서 코드를 작성할 때 따라야 할 기본 규칙을 정리한 초안이다.

이 문서의 목표는 아래와 같다.

1. 코드 스타일과 구조 판단 기준을 팀 안에서 일관되게 맞춘다.
2. 리뷰 시 취향 차이보다 구조와 품질에 집중할 수 있게 만든다.
3. `Next.js + React + BFF + Clean Architecture` 방향이 구현 중 흔들리지 않게 유지한다.

## 우선 원칙 🧭

이 프로젝트에서 코드 컨벤션은 단순한 "예쁜 코드" 규칙이 아니다.

가장 먼저 지켜야 할 기준은 아래 순서다.

1. 실제 코드 구조와 동작
2. 루트 `AGENTS.md`
3. `oss-frontend/AGENTS.md`
4. 이 문서의 규칙

즉, 포맷보다 구조가 우선이고, 스타일보다 책임 분리가 우선이다.

## 프로젝트 기본 철학 🥋

- `src/app`은 라우팅과 BFF 엔트리만 담당한다.
- 기능의 본체는 `src/features/<feature>` 아래에 둔다.
- 공통으로 검증된 코드만 `src/shared`에 둔다.
- 환경 변수와 설정은 `src/config`를 통해 접근한다.
- 브라우저에서 외부 API를 직접 호출하기보다 BFF를 우선 사용한다.
- 기본은 서버 컴포넌트이며, 클라이언트 컴포넌트는 꼭 필요할 때만 사용한다.

## 디렉터리 책임 규칙 🏗️

### `src/app`

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` 같은 엔트리 파일만 둔다.
- route handler와 page 파일은 가능한 한 얇게 유지한다.
- 비즈니스 로직, 외부 API 구현, 재사용 가능한 도메인 규칙은 두지 않는다.

### `src/features/<feature>`

- 기능 관련 코드는 가능한 한 feature 내부에 모은다.
- 기본 구조는 `presentation`, `application`, `domain`, `infrastructure`를 따른다.

### `presentation`

- 화면 렌더링, 컴포넌트, 사용자 인터랙션, 뷰 전용 상태를 둔다.
- 직접적인 외부 API 상세 구현은 두지 않는다.

### `application`

- 유스케이스, 흐름 조합, 입력 정리, 결과 가공 같은 서비스 레벨 로직을 둔다.

### `domain`

- 모델, 타입, 계약, 인터페이스, 핵심 규칙을 둔다.
- 가능한 한 `Next.js`, `React`, 인프라 세부 구현에 의존하지 않는다.

### `infrastructure`

- 외부 API, 저장소 구현, 외부 시스템 연결 코드를 둔다.

### `src/shared`

- 여러 feature에서 실제로 공통으로 사용하는 코드만 둔다.
- 아직 한 feature에서만 쓰는 코드는 먼저 feature 내부에 둔다.

### `src/config`

- 환경 변수, 런타임 설정, 상수 접근을 중앙화한다.
- `process.env`를 여러 파일에서 직접 읽지 않는다.

## 포맷팅 규칙 ✨

포맷팅은 사람마다 취향이 달라도 결과가 같아지도록 자동화하는 것을 목표로 한다.

### Prettier 도입 원칙

- 포맷팅은 수동 정리보다 자동 정리를 우선한다.
- 따옴표, 들여쓰기, 세미콜론, 줄바꿈, 후행 쉼표는 포매터가 일관되게 처리하게 한다.
- 팀원마다 다른 편집기 설정에 의존하지 않는다.

### 권장 기본값

아래 값은 초안 기준 추천안이다.

```json
{
  "singleQuote": false,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "all"
}
```

### 운영 기준

- JSX와 TSX가 많은 현재 코드베이스에는 `printWidth: 100`이 현실적이다.
- 너무 이른 단계의 세부 옵션 논쟁은 피하고, 일단 자동 통일 효과가 큰 옵션부터 적용한다.
- Tailwind class 정렬 자동화가 필요하면 `prettier-plugin-tailwindcss`를 함께 검토한다. 🎨

## import 규칙 📦

import는 단순 알파벳 정렬보다 "의존 방향"이 보이도록 정리한다.

### 그룹 순서

1. `next/*`
2. `react` 및 React 관련 import
3. 외부 라이브러리
4. `@/config/*`
5. `@/features/*`
6. `@/shared/*`
7. 상대경로 import

### 세부 규칙

- 그룹 사이에는 한 줄을 비운다.
- 같은 그룹 안에서는 이름 기준으로 정렬한다.
- `import type`은 같은 그룹 내에서 함께 두되, type import라는 사실이 드러나게 유지한다.
- `@/` alias 사용을 우선한다.
- 동일 feature 내부의 가까운 파일이 아니라면 긴 상대경로 import는 지양한다.

### import 예시

```ts
import { headers } from "next/headers";

import { z } from "zod";

import { env } from "@/config/env";
import { GetBootstrapInfoUseCase } from "@/features/bootstrap/application/get-bootstrap-info";
import type { BootstrapInfoResponse } from "@/features/bootstrap/domain/bootstrap-info";
import { HttpError } from "@/shared/lib/http/http-error";

import { mapBootstrapError } from "./map-bootstrap-error";
```

## 네이밍 규칙 🏷️

이 프로젝트는 파일 시스템 구조가 중요한 만큼 이름 규칙도 단순하고 예측 가능해야 한다.

### 파일 및 폴더

- 폴더명은 `kebab-case`를 사용한다.
- 일반 파일명은 `kebab-case`를 사용한다.
- Next.js 엔트리 파일은 프레임워크 관례를 따른다.

예시:

- `src/features/bootstrap/application/get-bootstrap-info.ts`
- `src/features/bootstrap/infrastructure/external-bootstrap-repository.ts`
- `src/app/api/bootstrap/info/route.ts`
- `src/app/version-info/page.tsx`

### 변수와 함수

- 변수명과 함수명은 `camelCase`를 사용한다.
- boolean 값은 가능하면 의미가 드러나는 이름을 사용한다.

예시:

- `osName`
- `requestHeaders`
- `needForceUpdate`
- `createBootstrapInfoUseCase`

### React 컴포넌트

- 컴포넌트 이름은 `PascalCase`를 사용한다.
- 파일명은 `kebab-case`, export symbol은 `PascalCase`를 유지한다.

예시:

- 파일: `version-info-page.tsx`
- 컴포넌트: `VersionInfoPage`

### 타입과 인터페이스

- 타입, 인터페이스, 클래스 이름은 `PascalCase`를 사용한다.

예시:

- `BootstrapInfoRequest`
- `BootstrapInfoResponse`
- `BootstrapRepository`
- `GetBootstrapInfoUseCase`

### 상수

- 모듈 내부 일반 상수는 `camelCase`를 사용한다.
- 전역적 의미가 강한 고정 상수는 `SCREAMING_SNAKE_CASE`를 사용할 수 있다.

예시:

- `DEFAULT_OS_NAME`
- `apiTimeoutMs`

## `"use client"` 사용 기준 🖥️

이 프로젝트는 기본적으로 서버 컴포넌트 우선 전략을 따른다.

### 기본 원칙

- `src/app`과 feature presentation 컴포넌트는 기본적으로 서버 컴포넌트로 작성한다.
- 아래 조건이 있을 때만 `"use client"`를 선언한다.

### `"use client"`가 필요한 경우

- `useState`, `useEffect`, `useRef` 같은 클라이언트 훅이 필요할 때
- 클릭, 입력, 드래그 등 브라우저 이벤트 핸들러가 필요할 때
- `window`, `document`, `localStorage` 같은 브라우저 API가 필요할 때
- 서버 컴포넌트로 처리할 수 없는 외부 UI 라이브러리를 사용할 때

### 지양할 패턴

- 단순 스타일링 때문에 page 전체를 클라이언트 컴포넌트로 바꾸는 것
- 서버에서 처리 가능한 데이터 조회를 브라우저 fetch로 옮기기 위해 `"use client"`를 붙이는 것
- 상위 page 파일에 바로 `"use client"`를 붙여 하위 전체를 클라이언트 번들에 포함시키는 것

### 권장 패턴

- page는 서버 컴포넌트로 유지한다.
- 인터랙션이 필요한 최소 단위만 클라이언트 컴포넌트로 분리한다.
- `"use client"`는 가능한 한 leaf component 가까이에 둔다.

작게 나누고, 꼭 필요한 곳만 클라이언트로 보내자. 가볍고 빠른 쪽이 이긴다. 🚀

## BFF 및 데이터 접근 규칙 🔌

- 외부 API 호출은 가능하면 `src/app/api/<feature>/route.ts`를 통해 감싼다.
- 브라우저가 외부 Base URL을 직접 알 필요가 없게 유지한다.
- route handler는 입력 검증, 유스케이스 호출, 응답 표준화 정도에 집중한다.
- fetch 상세 구현은 feature `infrastructure` 또는 `shared/lib/http`에 둔다.

권장 흐름:

```txt
Browser
  -> src/app/api/<feature>/route.ts
  -> src/features/<feature>/application/*
  -> src/features/<feature>/infrastructure/*
  -> src/shared/lib/http/*
  -> External API
```

## 의존 방향 규칙 🔄

의존 방향은 아래 기준을 유지한다.

```txt
Presentation -> Application -> Domain
                    ↓
             Infrastructure
```

### 실무 규칙

- `presentation`은 `application`을 사용할 수 있다.
- `application`은 `domain` 계약을 사용하고 `infrastructure` 구현을 조합할 수 있다.
- `domain`은 프레임워크와 인프라 세부 구현을 모르도록 유지한다.
- `shared`는 공통 기반을 제공하지만 feature 책임을 빼앗지 않도록 주의한다.

## 리뷰 체크리스트 ✅

리뷰 시 아래 항목을 우선 확인한다.

1. 코드가 올바른 레이어와 폴더에 배치되었는가
2. `app/page`나 `app/api`가 비즈니스 로직으로 비대해지지 않았는가
3. `shared`에 feature 전용 코드가 너무 빨리 올라가지 않았는가
4. import가 의존 방향을 어기지 않는가
5. `"use client"`가 꼭 필요한 곳에만 사용되었는가
6. 환경 변수 접근이 `src/config`를 통해 중앙화되었는가
7. 포맷팅 규칙이 자동화 도구와 충돌하지 않는가

## 첫 적용 시 권장 순서 🛠️

1. 이 문서를 팀 기준 초안으로 합의한다.
2. `Prettier`와 필요한 플러그인 도입 여부를 결정한다.
3. `import/order` 또는 동등한 정렬 규칙을 ESLint와 함께 정한다.
4. 새 파일부터 네이밍 규칙을 우선 적용한다.
5. `"use client"`는 신규 코드 리뷰에서 먼저 엄격히 적용한다.
6. 기존 코드 전체 일괄 수정은 기능 작업과 분리해서 진행한다.

## 한 줄 요약 😄

이 프로젝트의 좋은 코드는 "예쁘게 정렬된 코드"가 아니라, 책임이 맞는 위치에 있고, 서버 우선 원칙을 지키며, 팀이 예측 가능하게 읽을 수 있는 코드다.
