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
