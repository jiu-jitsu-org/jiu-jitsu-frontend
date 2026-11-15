import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 안전 영역은 globals.css의 --safe-area-top · --safe-area-bottom을 쓴다. iOS 웹뷰에선 env(safe-area-inset-*)가
  // 문서를 다 불러온 뒤에야 채워지는 때가 있어 첫 화면이 밀린다(앱이 문서 시작 때 넣는 값을 먼저 써야 한다).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/env\\(safe-area-inset/]",
          message: "env(safe-area-inset-*) 대신 var(--safe-area-top) · var(--safe-area-bottom)을 쓴다(globals.css).",
        },
        {
          selector: "TemplateElement[value.raw=/env\\(safe-area-inset/]",
          message: "env(safe-area-inset-*) 대신 var(--safe-area-top) · var(--safe-area-bottom)을 쓴다(globals.css).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
