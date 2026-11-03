# 디자인 토큰 (Design Tokens)

이 폴더는 **색상 디자인 시스템의 원본(Single Source of Truth)** 입니다.
Figma에서 정의한 색상을 그대로 옮겨온 JSON이며, 여기서 코드용 CSS가 자동 생성됩니다.

## 3단 구조

| 파일 | 레이어 | 설명 |
|---|---|---|
| `primitive.tokens.json` | **Primitive** | 원시 색상 팔레트 (Blue/500, Cool gray/900 …) |
| `semantic.tokens.json` | **Semantic** | 의미 기반 색상 (primary, text-primary …) → Primitive 참조 |
| `component.tokens.json` | **Component** | 컴포넌트별 색상 (button, dialog …) → Semantic 참조 |

참조 방향: **Component → Semantic → Primitive**

## 색을 바꾸고 싶을 때 (워크플로우)

1. **Figma**에서 변수(색상)를 수정한다.
2. Figma에서 변수 컬렉션 3개를 JSON으로 내보낸다.
3. 내보낸 JSON을 이 폴더의 파일 3개에 **덮어쓴다**
   (파일 이름은 위 표대로 `primitive` / `semantic` / `component` 유지).
4. 터미널에서 아래 명령을 한 번 실행한다.

   ```bash
   npm run tokens
   ```

5. 끝. `src/app/styles/tokens/` 아래 CSS가 전부 자동 갱신된다.

## 생성되는 파일 (자동 — 직접 수정 금지)

`npm run tokens` 를 실행하면 `src/app/styles/tokens/` 에 만들어집니다.

| 생성 파일 | 용도 |
|---|---|
| `primitive.css` | 원시 색상 CSS 변수 |
| `semantic.css` | 의미 색상 CSS 변수 |
| `component.css` | 컴포넌트 색상 CSS 변수 |
| `theme.css` | Tailwind 연결 — Semantic·Component 토큰을 유틸리티 클래스로 노출 |
| `manifest.ts` | `/ds`(디자인 시스템) 페이지가 읽는 토큰 목록 — 이름·참조·최종 색값 |

생성된 색 전체는 개발 서버의 `/ds` 페이지에서 눈으로 볼 수 있습니다.

## 코드에서 색을 쓰는 법 (개발자용)

- **Semantic·Component 색 모두** Tailwind 클래스로 바로 사용:
  `bg-primary`, `text-text-secondary`, `border-border-default`,
  `bg-button-filled-default-bg` 등 (`bg-·text-·border-` + 토큰 이름)
- **Primitive 색**(`--blue-50`, `--bw-white` 등)은 화면 코드에서 직접 쓰지 않습니다.
  같은 값의 Semantic 토큰을 고르세요(예: `--bw-white` → `bg-surface-container`).
- 모서리는 `rounded-10`·`rounded-15`·`rounded-20`(px 값 그대로), 글자는
  `text-body-m` 같은 타이포 스케일을 씁니다 — `src/app/globals.css` `@theme` 참고.

## 이름 규칙

- Figma 그룹 구분자 `/` → 코드에서는 `-` 로 바뀜
- 이름이 바로 위 그룹명을 반복하면 반복을 한 번 떼어냅니다
  (예: Figma `text / text-primary` → 코드 `--text-primary` → 클래스 `text-text-primary`)
- 이름에 공백·괄호·특수문자가 있으면 코드에서 자동 보정되며,
  `npm run tokens` 실행 시 어떤 이름이 바뀌었는지 경고로 알려줍니다.
  경고를 없애려면 Figma에서 해당 이름을 정리하세요.
