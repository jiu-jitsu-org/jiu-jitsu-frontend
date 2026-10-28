// 인스타 스토리식 띠 색 테두리 + 그랄 표현 3가지. 실행: OUT=<스크래치패드>/shots node shot4.mjs
import { chromium } from "playwright";
import { BELTS } from "./belt.mjs";
import { useSamples } from "./sample.mjs";
const PUB = process.env.PUB === "1";

const OUT = process.env.OUT;
const BASE = process.env.BASE ?? "http://localhost:3000";

// photo: 사진 지름, gap: 사진과 테두리 사이 틈, ring: 테두리 두께, mark: 그랄 줄 굵기(px)
const SIZES = {
  feed: { photo: 26, gap: 2, ring: 3, mark: 1.5 },
  big: { photo: 64, gap: 3, ring: 5, mark: 2.5 },
};
const MODES = PUB ? ["a"] : ["a", "b", "c"]; // a 테두리 속 검은 칸 · b 배지 · c 테두리 끊김

const b = await chromium.launch();
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const measures = {};
  for (const mode of MODES) {
    for (const [sz, S] of Object.entries(SIZES)) {
      const v = (PUB ? "pub-" : "") + `ring-${mode}-${sz}`;
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
          const BAR = (k) => (k === "black" ? "var(--red-500)" : "var(--bw-black)");
          const STRIPE = "var(--bw-true-white)";
          const cardBg = getComputedStyle(document.querySelector("article")).backgroundColor;
          const page = getComputedStyle(document.body).backgroundColor;
          const gapBg = cardBg === "rgba(0, 0, 0, 0)" ? page : cardBg;
          const r = S.photo / 2 + S.gap + S.ring / 2; // 테두리 중심 반지름
          const px2deg = (px) => (px / (2 * Math.PI * r)) * 360;
          // 각도 구간 [from,to,color] 을 바탕색 위에 얹은 conic-gradient (0deg = 12시, 시계 방향)
          const conic = (base, segs) => {
            const sorted = [...segs].sort((a, b) => a[0] - b[0]);
            const stops = [];
            let at = 0;
            for (const [f, t, c] of sorted) {
              stops.push(`${base} ${at}deg ${f}deg`, `${c} ${f}deg ${t}deg`);
              at = t;
            }
            stops.push(`${base} ${at}deg 360deg`);
            return `conic-gradient(${stops.join(",")})`;
          };
          // 가운데 각 center 에서 n개 줄을 pitch 간격으로 늘어놓은 구간들
          const marks = (center, n, w, pitch, color) =>
            Array.from({ length: n }, (_, i) => {
              const c = center + (i - (n - 1) / 2) * pitch;
              return [c - w / 2, c + w / 2, color];
            });

          document.querySelectorAll("article header").forEach((h, idx) => {
            const belt = BELTS[idx % BELTS.length];
            const av = h.querySelector("span.rounded-full");
            if (!av) return;
            av.style.width = av.style.height = S.photo + "px";
            const fill = FILL[belt.key];
            let bg;
            if (mode === "a") {
              const barW = 44;
              const center = 135;
              const segs = [[center - barW / 2, center + barW / 2, BAR(belt.key)]];
              const w = px2deg(S.mark), pitch = px2deg(S.mark * 2.4);
              // 두 겹: 바깥 테두리(띠 색+검은 칸) 위에 그랄 줄만 얹은 겹
              bg = conic(fill, segs);
              var stripeLayer = conic("transparent", marks(center, belt.grau, w, pitch, STRIPE));
            } else if (mode === "c") {
              const w = px2deg(S.mark), pitch = px2deg(S.mark * 2.6);
              bg = conic(fill, marks(180, belt.grau, w, pitch, gapBg));
            } else {
              bg = fill;
            }
            const ring = document.createElement("span");
            ring.style.cssText = `position:relative;display:inline-flex;flex:none;border-radius:9999px;padding:${S.ring}px;background:${stripeLayer ? stripeLayer + "," : ""}${bg}`;
            const gap = document.createElement("span");
            gap.style.cssText = `display:inline-flex;border-radius:9999px;padding:${S.gap}px;background:${gapBg}`;
            av.replaceWith(ring);
            gap.appendChild(av);
            ring.appendChild(gap);
            if (stripeLayer) {
              // 줄 겹은 테두리 두께 안에만 보이게: 안쪽(틈+사진)이 위를 덮는다
              gap.style.position = "relative";
            }
            if (mode === "b" && belt.grau > 0) { // 0그랄은 배지 없음
              const total = S.photo + 2 * (S.gap + S.ring);
              const d = Math.round(total * 0.36);
              const badge = document.createElement("span");
              badge.style.cssText = `position:absolute;right:${-S.ring * 0.4}px;bottom:${-S.ring * 0.4}px;width:${d}px;height:${d}px;border-radius:9999px;background:${BAR(belt.key)};box-shadow:0 0 0 ${Math.max(1.5, S.gap)}px ${gapBg};display:flex;align-items:center;justify-content:center;gap:${S.mark * 1.1}px`;
              for (let i = 0; i < belt.grau; i++) {
                const st = document.createElement("span");
                st.style.cssText = `width:${S.mark}px;height:${d * 0.5}px;border-radius:1px;background:${STRIPE}`;
                badge.appendChild(st);
              }
              ring.appendChild(badge);
            }
          });
          document.querySelector("article").scrollIntoView({ block: "start" });
          window.scrollBy(0, -12);
          const t = document.querySelector("article header + *").getBoundingClientRect();
          const hd = document.querySelector("article header").getBoundingClientRect();
          return { titleFromHeaderTop: Math.round(t.top - hd.top), gapBg };
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
        [...document.querySelectorAll("article header > * > span:first-child, article header > span:first-child")].slice(0, 5).map((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
        }),
      );
      for (const [i, bx] of boxes.entries()) {
        const pad = sz === "big" ? 8 : 4;
        await page.screenshot({ path: `${OUT}/${v}-av${i}.png`, fullPage: true, clip: { x: bx.x - pad, y: bx.y - pad, width: bx.w + 2 * pad, height: bx.h + 2 * pad } });
      }
    }
  }
  console.log(JSON.stringify(measures));
} finally {
  await b.close();
}
