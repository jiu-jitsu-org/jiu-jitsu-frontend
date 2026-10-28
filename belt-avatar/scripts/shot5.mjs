// 손그림 느낌의 삐뚤빼뚤 띠 테두리 + 아래로 삐죽 나온 띠 두 가닥(그랄 줄). 실행: OUT=<스크래치패드>/shots node shot5.mjs
import { chromium } from "playwright";
import { BELTS } from "./belt.mjs";
import { useSamples } from "./sample.mjs";
const PUB = process.env.PUB === "1";

const OUT = process.env.OUT;
const BASE = process.env.BASE ?? "http://localhost:3000";

// photo: 사진 지름, gap: 사진과 테두리 틈, w: 테두리 두께, mark: 그랄 줄 굵기
const SIZES = {
  feed: { photo: 26, gap: 2, w: 3, mark: 1.4 },
  big: { photo: 64, gap: 3.5, w: 5.5, mark: 2.6 },
};
const MODES = PUB ? ["clip"] : ["circle", "clip"]; // circle: 사진은 원형 · clip: 사진도 같은 삐뚤빼뚤 모양

const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const measures = {};
  for (const mode of MODES) {
    for (const [sz, S] of Object.entries(SIZES)) {
      const v = (PUB ? "pub-" : "") + `wob-${mode}-${sz}`;
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.waitForSelector("article header", { timeout: 30000 });
      await page.waitForTimeout(800);
      if (PUB) await useSamples(page);
      measures[v] = await page.evaluate(
        ({ mode, S, BELTS }) => {
          const FILL = {
            white: "var(--my-profile-header-bg-white)",
            blue: "var(--my-profile-header-bg-blue)",
            purple: "var(--my-profile-header-bg-purple)",
            brown: "var(--my-profile-header-bg-brown)",
            black: "var(--my-profile-header-bg-black)",
          };
          const STRIPE = (k) => (k === "black" ? "var(--bw-true-white)" : "var(--bw-black)");
          // 손으로 그린 듯한 9각: [각도(12시=0, 시계방향), 반지름 배율]
          const WOB = [[-8, 1.0], [33, 0.94], [70, 1.06], [108, 0.95], [147, 1.04], [188, 0.97], [228, 1.05], [266, 0.94], [306, 1.04]];
          const rp = S.photo / 2;
          const R0 = rp + S.gap + S.w / 2; // 테두리 중심선 반지름
          const m = S.w + S.gap + R0 * 0.07 + 2; // 사진 상자 밖 여백
          const tailExtra = R0 * 0.95;
          const W = S.photo + 2 * m, H = S.photo + 2 * m + tailExtra;
          const cx = m + rp, cy = m + rp;
          const pt = (a, r) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
          // 테두리 안쪽 선(띠 가닥이 여기서 잘린다). 띠 두께 절반만큼 안으로 + 살짝 테두리 속으로 들여 틈이 안 보이게
          const innerPts = WOB.map(([a, f]) => pt(a, R0 * f - S.w * 0.5 + 0.4).map((n) => n.toFixed(2)).join(",")).join(" ");
          const ringPts = WOB.map(([a, f]) => pt(a, R0 * f).map((n) => n.toFixed(2)).join(",")).join(" ");
          // 띠 가닥: 시작점(테두리 아래) → 방향으로 길이 L, 폭 T 인 띠. notch=true 면 끝을 V로 자름
          const strip = (startA, dirA, L, T, notch) => {
            const [sx, sy] = pt(startA, R0 * 0.82);
            const d = [Math.sin((dirA * Math.PI) / 180), -Math.cos((dirA * Math.PI) / 180)];
            const n = [-d[1], d[0]];
            const ex = sx + d[0] * L, ey = sy + d[1] * L;
            const p = (x, y, k) => [x + n[0] * k, y + n[1] * k];
            const a1 = p(sx, sy, T / 2), a2 = p(sx, sy, -T / 2), b1 = p(ex, ey, T / 2), b2 = p(ex, ey, -T / 2);
            const pts = notch ? [a1, b1, [ex - d[0] * T * 0.45, ey - d[1] * T * 0.45], b2, a2] : [a1, b1, b2, a2];
            return { poly: pts.map((q) => q.map((x) => x.toFixed(2)).join(",")).join(" "), sx, sy, d, n, L, T };
          };
          const T = R0 * 0.42;
          const left = strip(196, 212, R0 * 0.78, T, false);
          const right = strip(164, 148, R0 * 0.62, T, true);
          // 그랄 줄: 왼쪽 가닥 끝 쪽에 가로로
          const stripes = (belt) => {
            let out = "";
            const pitch = S.mark * 2.3;
            for (let i = 0; i < belt.grau; i++) {
              const t = left.L - T * 0.35 - i * pitch;
              const cxs = left.sx + left.d[0] * t, cys = left.sy + left.d[1] * t;
              const half = T / 2 + 0.6;
              const p1 = [cxs + left.n[0] * half, cys + left.n[1] * half], p2 = [cxs - left.n[0] * half, cys - left.n[1] * half];
              out += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${STRIPE(belt.key)}" stroke-width="${S.mark}"/>`;
            }
            return out;
          };
          // 사진을 같은 모양으로 자를 때: 사진 상자 기준 %로
          const innerScale = (rp - 0.5) / rp;
          const clipPoly = "polygon(" + WOB.map(([a, f]) => {
            const r = rp * f * innerScale * 0.97;
            const x = 50 + ((r * Math.sin((a * Math.PI) / 180)) / S.photo) * 100;
            const y = 50 - ((r * Math.cos((a * Math.PI) / 180)) / S.photo) * 100;
            return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
          }).join(",") + ")";

          document.querySelectorAll("article header").forEach((h, idx) => {
            const belt = BELTS[idx % BELTS.length];
            const av = h.querySelector("span.rounded-full");
            if (!av) return;
            av.style.width = av.style.height = S.photo + "px";
            if (mode === "clip") {
              av.style.borderRadius = "0";
              av.style.clipPath = clipPoly;
            }
            const wrap = document.createElement("span");
            wrap.style.cssText = `position:relative;display:inline-flex;flex:none;margin:${S.gap + S.w}px`;
            av.replaceWith(wrap);
            wrap.appendChild(av);
            const c = FILL[belt.key];
            const svg = `<svg data-wob width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:${-m}px;top:${-m}px;overflow:visible;pointer-events:none" aria-hidden="true">
              <mask id="m${idx}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><polygon points="${innerPts}" fill="#000"/></mask>
              <g mask="url(#m${idx})">
                <polygon points="${left.poly}" fill="${c}"/>${stripes(belt)}
                <polygon points="${right.poly}" fill="${c}"/>
              </g>
              <polygon points="${ringPts}" fill="none" stroke="${c}" stroke-width="${S.w}" stroke-linejoin="miter" stroke-miterlimit="6"/>
            </svg>`;
            wrap.insertAdjacentHTML("beforeend", svg);
            // 그랄 줄이 띠 가닥 밖으로 안 나가게 가닥 모양으로 자른다
            const sv = wrap.querySelector("svg");
            const id = `lt${idx}`;
            sv.insertAdjacentHTML("afterbegin", `<clipPath id="${id}"><polygon points="${left.poly}"/></clipPath>`);
            sv.querySelectorAll("line").forEach((l) => l.setAttribute("clip-path", `url(#${id})`));
            const bottom = sv.getBoundingClientRect().bottom;
            const over = Math.ceil(bottom - h.getBoundingClientRect().bottom);
            if (over > 0) h.style.marginBottom = over + 2 + "px";
          });
          document.querySelector("article").scrollIntoView({ block: "start" });
          window.scrollBy(0, -12);
          const t = document.querySelector("article header + *").getBoundingClientRect();
          const hd = document.querySelector("article header").getBoundingClientRect();
          return { titleFromHeaderTop: Math.round(t.top - hd.top) };
        },
        { mode, S, BELTS },
      );
      await page.waitForTimeout(500);
      if (PUB && sz === "feed") {
        const hs = await page.evaluate(() =>
          [...document.querySelectorAll("article header")].slice(0, 5).map((h) => {
            const r = h.getBoundingClientRect();
            const svg = h.querySelector("svg[data-wob]");
            const bottom = svg ? svg.getBoundingClientRect().bottom : r.bottom;
            return { y: r.top + window.scrollY, h: bottom - r.top };
          }),
        );
        for (const [i, b] of hs.entries()) await page.screenshot({ path: `${OUT}/${v}-hd${i}.png`, fullPage: true, clip: { x: 10, y: b.y - 6, width: 230, height: b.h + 10 } });
      }
      if (!PUB && sz === "feed") await page.screenshot({ path: `${OUT}/${v}.png`, clip: { x: 0, y: 0, width: 390, height: 640 } });
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll("svg[data-wob]")].slice(0, 5).map((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
        }),
      );
      for (const [i, bx] of boxes.entries()) {
        await page.screenshot({ path: `${OUT}/${v}-av${i}.png`, fullPage: true, clip: { x: bx.x - 4, y: bx.y - 4, width: bx.w + 8, height: bx.h + 6 } });
      }
    }
  }
  console.log(JSON.stringify(measures));
} finally {
  await b.close();
}
