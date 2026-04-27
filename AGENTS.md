# Jiu-Jitsu-Frontend AGENTS Guide

## 목적

이 저장소는 여러 개발자가 Git 기반으로 협업하는 `Next.js + React + BFF` 프로젝트다.

핵심 목표는 아래 3가지다.

1. 여러 사람과의 형상 관리 및 협업이 쉬운 구조 유지
2. Next.js를 통한 React Web 페이지와 REST API(BFF)의 통합 운영
3. Clean Architecture 기반 구조로 확장성과 유지보수성 확보

## 저장소 기준

- 실제 애플리케이션 루트는 `oss-frontend/`다.
- 프로젝트 문서의 최상위 개요는 루트 `README.md`를 기준으로 본다.
- Next.js 관련 구현 작업 전에는 `oss-frontend/AGENTS.md`의 프레임워크 주의사항을 함께 확인한다.

## 현재 구조

```txt
.
├── AGENTS.md
├── README.md
└── oss-frontend/
    ├── AGENTS.md
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

## 애플리케이션 구조 원칙

`oss-frontend/src`는 아래 책임을 가진다.

- `app/`
  Next.js App Router 엔트리, 페이지 라우팅, 레이아웃, BFF API 진입점 관리
- `app/api/`
  외부 API를 직접 노출하지 않고 브라우저 요청을 중계하는 BFF 계층
- `features/`
  기능 단위 모듈. 각 기능은 가능하면 아래 구조를 따른다.
  - `presentation/`: UI, 화면, hooks
  - `application/`: 유스케이스, 서비스 흐름
  - `domain/`: 엔티티, 인터페이스, 규칙
  - `infrastructure/`: 외부 API, repository 구현
- `shared/`
  특정 feature에 종속되지 않는 공통 컴포넌트, 타입, 유틸, 라이브러리
- `config/`
  환경 변수 매핑, 상수, 런타임 설정

## 아키텍처 원칙

기본 의존 방향은 아래를 따른다.

```txt
Presentation -> Application -> Domain
                    ↓
             Infrastructure
```

작업 시 아래 원칙을 유지한다.

- UI 로직은 `presentation`에 둔다.
- 비즈니스 흐름 조합은 `application`에 둔다.
- 핵심 규칙과 모델 의미는 `domain`에 둔다.
- 외부 시스템 연동은 `infrastructure`에 둔다.
- 공통화가 정말 필요한 경우에만 `shared`로 올린다.

## 협업 원칙

- 작업은 기능 단위로 분리한다.
- 공통 코드와 기능 코드를 섞지 않는다.
- 구조 변경 시 문서도 함께 갱신한다.
- 루트 설정 파일 변경 시 영향 범위를 명확히 설명한다.
- 사용하지 않는 추상화는 미리 만들지 않는다.

## 구현 원칙

- React Web 화면은 `src/app`과 `src/features/*/presentation` 중심으로 구현한다.
- 외부 API 호출은 가능하면 `src/app/api`를 통해 BFF로 노출한다.
- 브라우저에서 외부 API를 직접 호출하는 방식은 특별한 이유가 없으면 피한다.
- import alias `@/`는 `oss-frontend/src` 기준으로 사용한다.
- 정적 자산은 `oss-frontend/public`에 둔다.
- `package.json`, `next.config.ts`, `.env.*`는 `oss-frontend` 루트에 유지한다.

## 작업 지침

이 저장소에서 작업할 때는 아래를 우선한다.

- 구조 변경보다 현재 구조 안에서 책임 분리를 먼저 맞춘다.
- 새 기능 추가 시 먼저 어느 feature에 속하는지 판단한다.
- 공통 모듈로 뺄지 여부는 재사용성과 의존 방향을 보고 결정한다.
- Next.js 동작이나 파일 규칙이 애매하면 `oss-frontend/node_modules/next/dist/docs/`의 관련 문서를 먼저 확인한다.
- 문서와 실제 구조가 어긋나면 코드를 기준으로 맞추되, 필요한 문서 수정도 함께 진행한다.

## 우선순위

작업 우선순위는 아래 기준을 따른다.

1. 협업 시 이해하기 쉬운 구조 유지
2. BFF와 화면 책임 분리
3. Clean Architecture 의존 방향 유지
4. 과도한 추상화보다 실제 기능 전달 우선
