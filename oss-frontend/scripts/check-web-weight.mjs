/**
 * check-web-weight.mjs
 * ────────────────────────────────────────────────────────────────
 * 웹이 다시 무거워지지 않게 막는 검사(#318). 규칙은 루트 AGENTS.md "웹 무게 규칙"에 있다.
 *
 *   실행:  npm run check:weight   (CI: .github/workflows/web-weight-check.yml)
 *
 * 막는 것
 *   1. 이미지 한 장이 상한(MAX_IMAGE_BYTES)을 넘음
 *   2. `<img src="..." width={n}>` 처럼 표시 크기가 코드에 적힌 PNG가 표시 크기의 3배를 넘음
 *   3. 코드 어디에서도 부르지 않는 이미지 (public은 주소, src는 import 경로로 찾는다)
 *   4. 레이아웃·페인트를 타는 속성(width, clip-path 등)을 움직이는 transition·keyframes
 *   5. 무한 반복 애니메이션 토큰(motion.css)
 *
 * 꼭 필요하면 web-weight-exceptions.json에 이유와 함께 적는다. 이유 없는 예외는 실패한다.
 * 의존성 없이 돈다 — CI에서 npm ci 없이 바로 실행한다.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_IMAGE_BYTES = 100 * 1024;
const MAX_DISPLAY_RATIO = 3;
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
const SOURCE_EXT = /\.(tsx?|css|mjs)$/;
/** transform·opacity 말고 움직이면 매 프레임 레이아웃이나 페인트를 다시 하는 속성. */
const HEAVY_PROPS =
  "width|height|min-height|max-height|min-width|max-width|margin(?:-\\w+)?|padding(?:-\\w+)?|top|left|right|bottom|clip-path|filter|backdrop-filter|box-shadow|grid-template-(?:rows|columns)|font-size|font-weight";

const { images: imageExceptions, motion: motionExceptions } = JSON.parse(
  readFileSync(join(ROOT, "scripts/web-weight-exceptions.json"), "utf8"),
);
const errors = [];
const usedExceptions = new Set();

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      })
    : [];
const rel = (path) => relative(ROOT, path);

const sources = walk(join(ROOT, "src"))
  .filter((path) => SOURCE_EXT.test(path))
  .map((path) => ({ path: rel(path), text: readFileSync(path, "utf8") }));
const allSource = sources.map((source) => source.text).join("\n");

/** 예외 표에 이유와 함께 적혀 있으면 true. 이유가 비었으면 그것도 오류다. */
function excepted(table, key) {
  if (!(key in table)) return false;
  usedExceptions.add(key);
  if (!String(table[key]).trim()) errors.push(`${key}: 예외에 이유가 없습니다.`);
  return true;
}

/* ── 이미지 ─────────────────────────────────────────── */
/** PNG 머리글의 가로 픽셀. PNG가 아니면 null. */
function pngWidth(path) {
  const head = readFileSync(path).subarray(0, 24);
  return head.toString("latin1", 1, 4) === "PNG" ? head.readUInt32BE(16) : null;
}

const publicDir = join(ROOT, "public");
const srcDir = join(ROOT, "src");
const appDir = join(srcDir, "app");
// src 아래 그림도 본다 — 앱 실행 때마다 받는 그림은 feature 안에 두고 import해 해시 주소로 내보낸다(#410).
const images = [...walk(publicDir), ...walk(srcDir)].filter((path) =>
  IMAGE_EXT.test(path),
);

for (const path of images) {
  const name = rel(path);
  const bytes = statSync(path).size;
  if (bytes > MAX_IMAGE_BYTES && !excepted(imageExceptions, name)) {
    errors.push(
      `${name}: ${Math.round(bytes / 1024)}KB — 상한 ${MAX_IMAGE_BYTES / 1024}KB를 넘습니다. 압축하거나 예외에 이유를 적으세요.`,
    );
  }

  // src/app의 이미지는 파일 이름 규칙(favicon 등)으로 쓰인다 — 부르는 코드가 없는 게 정상이다.
  if (path.startsWith(appDir + sep)) continue;
  // 그 밖의 src 이미지는 import로 쓰인다 — 주소 대신 `@/` import 경로 전체가 소스에 있는지 본다.
  // 파일 이름만 보면 다른 폴더의 같은 이름이나 옛 주소 문자열에 속는다. 상대 경로 import는 쓰지 않는다(루트 AGENTS.md).
  // 주소로 부르지 않으니 아래 3배 검사(<img src="주소" width>)는 해당하지 않는다 — PR 양식으로 확인한다.
  if (!path.startsWith(publicDir + sep)) {
    const specifier = `@/${relative(srcDir, path).split(sep).join("/")}`;
    const imported = allSource.includes(`${specifier}"`) || allSource.includes(`${specifier}'`);
    if (!imported && !excepted(imageExceptions, name)) {
      errors.push(`${name}: 코드에서 import하는 곳이 없습니다(\`${specifier}\`). 지우거나 예외에 이유를 적으세요.`);
    }
    continue;
  }
  const url = `/${relative(publicDir, path)}`;
  // 경로를 조립해 부르는 경우(`/images/x/${name}.webp`)는 폴더 뒤에 조립이 이어질 때만 쓰는 것으로 본다.
  const used =
    allSource.includes(url) || allSource.includes(`${dirname(url)}/\${`);
  if (!used && !excepted(imageExceptions, name)) {
    errors.push(`${name}: 코드에서 부르는 곳이 없습니다. 지우거나 예외에 이유를 적으세요.`);
  }

  const intrinsic = pngWidth(path);
  if (intrinsic === null) continue;
  for (const { text } of sources) {
    for (const tag of text.matchAll(/<img\b[^>]*?>/gs)) {
      const width = tag[0].match(/\bwidth=\{(\d+)\}/);
      if (!width || !tag[0].includes(`"${url}"`)) continue;
      const display = Number(width[1]);
      if (intrinsic > display * MAX_DISPLAY_RATIO && !excepted(imageExceptions, name)) {
        errors.push(
          `${name}: 가로 ${intrinsic}px — 표시 폭 ${display}px의 ${MAX_DISPLAY_RATIO}배(${display * MAX_DISPLAY_RATIO}px)를 넘습니다.`,
        );
      }
    }
  }
}

/* ── 움직임 ─────────────────────────────────────────── */
const transitionList = /transition-\[([^\]]*)\]|\[transition:([^\]]*)\]/g;
const heavyProp = new RegExp(`(?:^|[,_])(${HEAVY_PROPS})(?=$|[,_])`, "g");
const heavyKeyframeProp = new RegExp(`^\\s*(${HEAVY_PROPS})\\s*:`);

for (const { path, text } of sources) {
  const found = new Set();
  for (const match of text.matchAll(transitionList)) {
    for (const prop of (match[1] ?? match[2]).matchAll(heavyProp)) found.add(prop[1]);
  }

  if (path.endsWith(".css")) {
    for (const start of text.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
      // 칸마다 중괄호가 또 있어 정규식으로는 끝을 못 잡는다 — 짝을 세어 블록 끝을 찾는다.
      let depth = 1;
      let end = start.index + start[0].length;
      while (depth > 0 && end < text.length) {
        if (text[end] === "{") depth += 1;
        if (text[end] === "}") depth -= 1;
        end += 1;
      }
      for (const line of text.slice(start.index, end).split("\n")) {
        const prop = line.match(heavyKeyframeProp);
        if (prop) found.add(`${start[1]}:${prop[1]}`);
      }
    }
    for (const token of text.matchAll(/--animate-([\w-]+):[^;]*\binfinite\b/g)) {
      found.add(`infinite:${token[1]}`);
    }
  }

  for (const prop of found) {
    const key = `${path}::${prop}`;
    if (!excepted(motionExceptions, key)) {
      errors.push(
        `${key}: 움직임 규칙에 걸립니다. transform·opacity로 바꾸거나 예외에 이유를 적으세요.`,
      );
    }
  }
}

/* ── 결과 ───────────────────────────────────────────── */
const stale = [...Object.keys(imageExceptions), ...Object.keys(motionExceptions)].filter(
  (key) => !usedExceptions.has(key),
);
for (const key of stale) console.warn(`[참고] 더는 필요 없는 예외입니다. 지워 주세요: ${key}`);

const totalBytes = images.reduce((sum, path) => sum + statSync(path).size, 0);
console.log(
  `이미지 ${images.length}장, 합계 ${Math.round(totalBytes / 1024)}KB · 움직임 파일 ${sources.length}개 검사`,
);

if (errors.length > 0) {
  console.error(`\n웹 무게 규칙 위반 ${errors.length}건 (규칙: 루트 AGENTS.md "웹 무게 규칙")`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log("통과");
