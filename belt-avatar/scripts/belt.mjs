// 띠 아바타 시안 공용 그리기 함수 — 촬영 스크립트(브라우저 안)와 캔버스 HTML 이 같이 쓴다.
export const BELTS = [
  { key: "white", grau: 2 },
  { key: "blue", grau: 1 },
  { key: "purple", grau: 3 },
  { key: "brown", grau: 0 },
  { key: "black", grau: 4 },
];

// 문자열로 내보내 page.evaluate / HTML <script> 에 그대로 심는다.
export const DRAW_SRC = String.raw`
const BELT_FILL = {
  white: "var(--my-profile-header-bg-white, #b7b9bd)",
  blue: "var(--my-profile-header-bg-blue, #0090ff)",
  purple: "var(--my-profile-header-bg-purple, #cd57ff)",
  brown: "var(--my-profile-header-bg-brown, #a66040)",
  black: "var(--my-profile-header-bg-black, #2d2d2d)",
};
const BAR_FILL = (k) => (k === "black" ? "var(--red-500, #ff1d0d)" : "var(--bw-black, #0d0d0d)");
const STRIPE = "var(--bw-true-white, #ffffff)";

// A안: 사진 아래 테두리를 따라 감긴 띠 + 정면 매듭 + 늘어진 끝자락(그랄 칸).
// viewBox 40 기준 — 사진 지름 S 에 맞춰 같은 비율로 커진다.
function beltWrapSvg(key, grau, size) {
  const c = BELT_FILL[key];
  const h = (size * 56) / 40;
  let stripes = "";
  for (let i = 0; i < grau; i++) {
    stripes += '<rect x="17.5" y="' + (46.2 + i * 1.9).toFixed(1) + '" width="5" height="1.1" fill="' + STRIPE + '"/>';
  }
  return (
    '<svg width="' + size + '" height="' + h + '" viewBox="0 0 40 56" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" aria-hidden="true">' +
      '<path d="M4.6 27.2 A17 17 0 0 0 35.4 27.2" fill="none" stroke="' + c + '" stroke-width="6"/>' +
      '<g transform="rotate(10 20 40)">' +
        '<rect x="17.5" y="39" width="5" height="16" rx="0.6" fill="' + c + '"/>' +
        '<rect x="17.5" y="45" width="5" height="8" fill="' + BAR_FILL(key) + '"/>' + stripes +
      '</g>' +
      '<rect x="15.8" y="33.2" width="8.4" height="7.4" rx="1.8" fill="' + c + '" stroke="var(--bw-true-white, #fff)" stroke-width="1"/>' +
    '</svg>'
  );
}

// B안: 닉네임 옆 알약 칩 — 띠 색 몸통 + 오른쪽 끝 검은 칸(검은띠는 빨강) + 그랄 줄.
function beltChipHtml(key, grau, scale) {
  const s = scale || 1;
  let stripes = "";
  for (let i = 0; i < grau; i++) {
    stripes += '<span style="position:absolute;top:0;bottom:0;width:' + 1.2 * s + 'px;right:' + (1.6 + i * 2.2) * s + 'px;background:' + STRIPE + '"></span>';
  }
  return (
    '<span data-belt-chip style="position:relative;display:inline-block;flex:none;width:' + 24 * s + 'px;height:' + 8 * s + 'px;border-radius:' + 4 * s + 'px;overflow:hidden;background:' + BELT_FILL[key] + ';margin-left:' + 6 * s + 'px">' +
      '<span style="position:absolute;top:0;bottom:0;right:' + 3 * s + 'px;width:' + 10.5 * s + 'px;background:' + BAR_FILL(key) + '">' + stripes + '</span>' +
    '</span>'
  );
}
`;
