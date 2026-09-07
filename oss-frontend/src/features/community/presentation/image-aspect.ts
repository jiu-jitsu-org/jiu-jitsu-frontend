/**
 * 게시글 이미지 허용 비율 규격 (#121).
 *
 * 상세 1장 · 상세 캐러셀 · 목록 카드가 같은 허용 비율을 쓴다. 세 곳이 각자 상수를 들면
 * 정책이 바뀔 때 한 곳만 고쳐지고 나머지가 조용히 어긋나므로 여기 하나로 모은다.
 *
 * 폭은 어디서나 `화면 폭 − 32`(좌우 여백 16)다. 허용 비율을 벗어나는 원본만 object-cover가
 * center crop 한다 — 세로가 길면 상하, 가로가 길면 좌우.
 *
 * 값이 JS 계산이 아니라 CSS 식인 이유: 측정 후 반영하면 첫 페인트에서 한 번 튄다.
 * 뷰포트 단위는 브라우저가 레이아웃 시점에 이미 알고 있어 회전·폴드 전환도 공짜로 따라온다.
 */

/** 좌우 여백 16 × 2 — 이미지 폭 W = 화면 폭 − 32. */
const SIDE_INSET = "32px";

/** 이미지 폭 W. 절대값(343 등)을 박지 않고 기기 폭을 따라간다. */
export const IMAGE_WIDTH = `calc(100vw - ${SIDE_INSET})`;

/** 허용 비율 하한 4:5 — 이보다 세로로 길면 상하를 잘라낸다. (폭 ÷ 높이 기준) */
const MIN_ASPECT_RATIO = 4 / 5;
/** 허용 비율 상한 1.91:1 — 이보다 가로로 길면 좌우를 잘라낸다. */
const MAX_ASPECT_RATIO = 1.91;

/**
 * 1장 · 목록 카드 — 폭 W 고정, 높이는 원본 비율 자동.
 * 자동 높이가 이 범위를 벗어나는 장에만 min/max가 걸리고, 그 장만 잘린다.
 */
export const IMAGE_MIN_HEIGHT = `calc(${IMAGE_WIDTH} / ${MAX_ASPECT_RATIO})`;
export const IMAGE_MAX_HEIGHT = `calc(${IMAGE_WIDTH} / ${MIN_ASPECT_RATIO})`;

/** 캐러셀 높이 — 전 장 공통이고 폭 W와 같다. */
export const SLIDE_HEIGHT = IMAGE_WIDTH;

/**
 * 캐러셀 슬라이드 폭 — 높이가 고정이라 폭이 원본 비율을 받는다.
 * 상한(높이 × 1.91)이 화면 폭보다 넓어 가로로 긴 장은 한 화면에 다 들어오지 않는다.
 * 폭을 W로 다시 자르지 않기로 확정된 동작이다(#121).
 */
export const SLIDE_MIN_WIDTH = `calc(${SLIDE_HEIGHT} * ${MIN_ASPECT_RATIO})`;
export const SLIDE_MAX_WIDTH = `calc(${SLIDE_HEIGHT} * ${MAX_ASPECT_RATIO})`;
