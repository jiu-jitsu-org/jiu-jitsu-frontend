# oss-frontend

## 구조

이 애플리케이션은 `src/` 전환형 구조를 사용합니다.

```txt
.
├── public/
├── src/
│   ├── app/
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

## 시작

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

첫 화면은 `src/app/page.tsx`에서 수정합니다.
