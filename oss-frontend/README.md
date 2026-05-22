# oss-frontend

## 구조

이 애플리케이션은 `src/` 전환형 구조를 사용합니다.

```txt
.
├── design-tokens/                # 컬러 토큰 원본 JSON (Figma 내보내기)
├── public/
├── scripts/
│   └── build-tokens.mjs          # 토큰 JSON -> CSS 변환기
├── src/
│   ├── app/
│   │   ├── styles/
│   │   │   └── tokens/           # 자동 생성 CSS (npm run tokens)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── config/
│   ├── features/
│   └── shared/
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 경로 규칙

- Next.js 엔트리 파일은 `src/app` 아래에 둡니다.
- 공용 import alias `@/`는 `src/`를 가리킵니다.
- 정적 자산은 계속 `public/` 루트에 둡니다.
- 설정 파일과 `.env.*` 파일은 루트에 유지합니다.

## 데이터 조회 규칙

- 브라우저 또는 외부 HTTP 클라이언트가 호출해야 하는 API는 `src/app/api` Route Handler로 노출합니다.
- Server Component 초기 조회는 내부 Route Handler를 다시 `fetch`하지 않고 feature application layer를 직접 호출합니다.
- 외부 REST API 호출은 feature `infrastructure`와 `src/shared/lib/http`를 통해 서버에서 수행합니다.
- 사용자 mutation용 Server Action은 `src/features/<feature>/presentation/actions` 위치를 우선합니다.

예시:

```txt
src/app/version-info/page.tsx
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/application/get-bootstrap-info.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/http-client.ts
```

사용자가 `/version-info`에서 버튼을 눌러 다시 조회하는 흐름:

```txt
src/features/bootstrap/presentation/version-info-page.tsx
  -> src/features/bootstrap/presentation/actions/load-bootstrap-info-action.ts
  -> src/features/bootstrap/application/get-bootstrap-info-page-data.ts
  -> src/features/bootstrap/infrastructure/external-bootstrap-repository.ts
  -> src/shared/lib/http/http-client.ts
```

## 디자인 토큰 (컬러 시스템)

색상은 디자인 토큰으로 관리합니다. 3단 구성(Primitive → Semantic → Component)이며
원본은 `design-tokens/*.tokens.json`(Figma 내보내기)입니다.

```bash
npm run tokens
```

위 명령이 JSON을 `src/app/styles/tokens/*.css`로 변환합니다.
생성된 CSS는 직접 수정하지 않습니다. 색을 바꾸려면 Figma 수정 →
JSON을 `design-tokens/`에 덮어쓰기 → `npm run tokens` 순서로 진행합니다.

상세 사용법은 `design-tokens/README.md`를 참고하세요.

## 시작

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

첫 화면은 `src/app/page.tsx`에서 수정합니다.
