/**
 * build-tokens.mjs
 * ────────────────────────────────────────────────────────────────
 * Figma에서 내보낸 디자인 토큰(JSON)을 CSS 변수로 변환하는 스크립트.
 *
 *   실행:  npm run tokens
 *
 *   입력:  design-tokens/primitive.tokens.json   (원시 팔레트)
 *          design-tokens/semantic.tokens.json    (의미 토큰)
 *          design-tokens/component.tokens.json   (컴포넌트 토큰)
 *
 *   출력:  src/app/styles/tokens/primitive.css
 *          src/app/styles/tokens/semantic.css
 *          src/app/styles/tokens/component.css
 *          src/app/styles/tokens/theme.css       (Tailwind 연결용)
 *
 * Figma에서 색을 수정한 뒤 JSON 3개를 다시 내보내 design-tokens/ 에
 * 덮어쓰고 이 스크립트를 실행하면 위 CSS가 전부 자동 갱신됩니다.
 * 출력 CSS는 직접 수정하지 마세요. (실행할 때마다 덮어써집니다)
 * ────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const SRC_DIR = join(ROOT, "design-tokens");
const OUT_DIR = join(ROOT, "src/app/styles/tokens");

// 처리할 토큰 파일 (3단 구성)
const LAYERS = [
  { key: "primitive", title: "Primitive 토큰 — 원시 색상 팔레트" },
  { key: "semantic", title: "Semantic 토큰 — 의미 기반 색상" },
  { key: "component", title: "Component 토큰 — 컴포넌트별 색상" },
];

// 자동 보정된(=Figma 이름과 코드 이름이 달라진) 토큰을 모아두는 곳
const renamed = new Map();

// ────────────────────────────────────────────────────────────────
// 이름 정리 규칙 (iOS 디자인 시스템과 동일하게 맞춤)
//   1) 공백·괄호·& 등 CSS에 못 쓰는 문자 정리
//      "Cool gray"→"cool-gray"   "500(P)"→"500p"   "B&W"→"bw"
//   2) 중복 접두사 제거: 토큰명이 그룹명을 반복하면 그 반복을 떼어냄
//      그룹 text + 토큰 text-primary → "text-primary" (text 한 번만)
//   3) Primitive 최상위 "Color" 그룹명은 이름에서 제외
//      Color/Blue/50 → "blue-50"
// ────────────────────────────────────────────────────────────────
function sanitizeSegment(segment) {
  return String(segment)
    .trim()
    .replace(/[()&]/g, "") // 괄호·& 는 제거 ("500(P)"→"500P", "B&W"→"BW")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // 그 외 문자(공백 등)는 하이픈으로
    .replace(/^-+|-+$/g, ""); // 양 끝 하이픈 제거
}

// CSS 변수 이름에 그대로 쓸 수 없는 문자가 있는지 검사 (공백·괄호·& 등)
function hasUnsafeChars(segment) {
  return /[^a-zA-Z0-9_-]/.test(String(segment).trim());
}

// 중복 접두사 제거: 각 조각이 바로 위 그룹명을 반복하면 그 부분을 떼어낸다.
//   ["text","text-primary"]  → ["text","primary"]
//   ["primary","primary"]    → ["primary"]
function dedupePath(segments) {
  const out = [];
  for (let i = 0; i < segments.length; i++) {
    let seg = segments[i];
    const parent = i > 0 ? segments[i - 1] : null;
    if (parent) {
      if (seg === parent) continue; // 토큰명 == 그룹명 → 중복 조각 버림
      if (seg.startsWith(`${parent}-`)) seg = seg.slice(parent.length + 1);
    }
    if (seg) out.push(seg);
  }
  return out;
}

// 경로 조각들 → CSS 변수 이름. ["text","text-primary"] → "text-primary"
function toVarName(pathSegments) {
  for (const seg of pathSegments) {
    if (hasUnsafeChars(seg)) {
      renamed.set(String(seg).trim(), sanitizeSegment(seg));
    }
  }
  let segs = pathSegments.map(sanitizeSegment).filter(Boolean);
  if (segs.length > 1 && segs[0] === "color") segs = segs.slice(1); // "Color" 제외
  return dedupePath(segs).join("-");
}

// Figma alias 경로("text/text-primary") → CSS 변수 이름
function aliasToVarName(targetVariableName) {
  return toVarName(targetVariableName.split("/"));
}

// 색상 값 → CSS 색상 문자열. 반투명(alpha<1)이면 8자리 hex로.
function colorToCss(value) {
  const hex = String(value?.hex ?? "#000000").toLowerCase();
  const alpha = value?.alpha ?? 1;
  if (alpha >= 1) return hex;
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alphaHex}`;
}

// ────────────────────────────────────────────────────────────────
// JSON 트리를 훑어 토큰(잎 노드)만 모은다.
// 토큰 = $type 과 $value 를 가진 노드. 그 외는 그룹으로 보고 더 파고든다.
// ────────────────────────────────────────────────────────────────
function collectTokens(node, pathSoFar, out) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue; // $extensions 등 메타데이터는 건너뜀
    if (!value || typeof value !== "object") continue;

    if ("$type" in value && "$value" in value) {
      out.push({ path: [...pathSoFar, key], token: value });
    } else {
      collectTokens(value, [...pathSoFar, key], out);
    }
  }
  return out;
}

// 토큰 하나의 CSS 값을 계산한다.
// alias(다른 변수 참조)가 있으면 var(...), 없으면 원시 색상값.
function tokenToCssValue(token) {
  const alias = token.$extensions?.["com.figma.aliasData"];
  if (alias?.targetVariableName) {
    return `var(--${aliasToVarName(alias.targetVariableName)})`;
  }
  return colorToCss(token.$value);
}

// 토큰 목록 → :root { ... } CSS 파일 내용
function buildLayerCss(tokens, title) {
  const lines = tokens.map(({ path, token }) => {
    return `  --${toVarName(path)}: ${tokenToCssValue(token)};`;
  });
  return [
    `/* ${title}`,
    ` * 이 파일은 scripts/build-tokens.mjs 가 자동 생성합니다. 직접 수정하지 마세요.`,
    ` * 수정하려면 design-tokens/*.tokens.json 을 고치고 \`npm run tokens\` 실행. */`,
    `:root {`,
    ...lines,
    `}`,
    ``,
  ].join("\n");
}

// Semantic 토큰 → Tailwind @theme 블록.
// 변수 이름은 toVarName 과 같은 규칙을 쓰므로 bg-primary, text-text-secondary
// 같은 클래스로 바로 쓸 수 있다.
function buildThemeCss(semanticTokens) {
  const lines = [];
  const used = new Set();
  for (const { path } of semanticTokens) {
    const name = toVarName(path);
    if (used.has(name)) {
      console.warn(`  ⚠️  Tailwind 이름 충돌로 건너뜀: --color-${name}`);
      continue;
    }
    used.add(name);
    lines.push(`  --color-${name}: var(--${name});`);
  }
  return [
    `/* Tailwind 연결 — Semantic 토큰을 유틸리티 클래스로 노출`,
    ` * 이 파일은 scripts/build-tokens.mjs 가 자동 생성합니다. 직접 수정하지 마세요.`,
    ` * 예) --color-primary → 클래스 bg-primary / text-primary / border-primary */`,
    `@theme inline {`,
    ...lines,
    `}`,
    ``,
  ].join("\n");
}

// ────────────────────────────────────────────────────────────────
// 실행
// ────────────────────────────────────────────────────────────────
function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let semanticTokens = [];
  let total = 0;

  for (const { key, title } of LAYERS) {
    const inputPath = join(SRC_DIR, `${key}.tokens.json`);
    let json;
    try {
      json = JSON.parse(readFileSync(inputPath, "utf8"));
    } catch (error) {
      console.error(`\n❌ ${key}.tokens.json 을 읽을 수 없습니다: ${inputPath}`);
      console.error(`   (${error.message})`);
      process.exit(1);
    }

    const tokens = collectTokens(json, [], []);
    writeFileSync(join(OUT_DIR, `${key}.css`), buildLayerCss(tokens, title));
    console.log(`  ✅ ${key}.css — 토큰 ${tokens.length}개`);
    total += tokens.length;

    if (key === "semantic") semanticTokens = tokens;
  }

  writeFileSync(join(OUT_DIR, "theme.css"), buildThemeCss(semanticTokens));
  console.log(`  ✅ theme.css — Tailwind 연결 ${semanticTokens.length}개`);

  console.log(`\n  토큰 ${total}개를 CSS로 변환했습니다.`);

  // Figma 이름과 코드 이름이 달라진 토큰 안내
  if (renamed.size > 0) {
    console.log(
      `\n  ⚠️  아래 ${renamed.size}개는 CSS에 못 쓰는 문자가 있어 코드 이름이 Figma와 다릅니다:`,
    );
    for (const [from, to] of renamed) {
      console.log(`     Figma "${from}"  →  코드 "${to}"`);
    }
    console.log(
      `     → Figma에서 이 이름들의 공백·괄호·특수문자를 정리하면 경고가 사라집니다.`,
    );
  } else {
    console.log(`\n  ✅ 모든 이름이 깨끗합니다. Figma 이름 = 코드 이름.`);
  }
  console.log("");
}

main();
