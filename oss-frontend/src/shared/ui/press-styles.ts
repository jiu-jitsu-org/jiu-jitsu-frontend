/**
 * 눌림(pressed) 공통 클래스.
 *
 * 누르는 동안 색 면이 깔리는 패턴이 화면마다 같은 문자열로 흩어져 있어 여기 한 곳에 모은다.
 * 색 전환(120ms)만 `motion-safe:`로 감싸고, 눌림 색 자체는 동작 줄이기 설정과 상관없이 보인다.
 * 크기·여백·라운드는 호출부가 정한다(아이콘 버튼만 둥근 면이 기본이라 rounded-full을 포함한다).
 */

/** 색 전환 120ms — 아래 눌림 색 클래스들이 함께 쓴다. */
const PRESS_COLOR_TRANSITION =
  "motion-safe:transition-colors motion-safe:duration-120";

/** 아이콘 버튼(앱바 뒤로·⋮ 등) — 누르는 동안 아이콘 뒤에 둥근 옅은 면이 깔린다. */
export const ICON_BUTTON_PRESS = `rounded-full ${PRESS_COLOR_TRANSITION} active:bg-surface-container-pressed`;

/** 줄·카드 — 누르는 동안 바탕이 옅게 물든다. */
export const SURFACE_PRESS = `${PRESS_COLOR_TRANSITION} active:bg-surface-container-pressed`;

/** neutral 버튼(회색 바탕) — 눌림 바탕색. */
export const NEUTRAL_BUTTON_PRESS = `${PRESS_COLOR_TRANSITION} active:bg-button-neutral-pressed-bg`;

/** filled 버튼(주 색 바탕) — 눌림 바탕색. */
export const FILLED_BUTTON_PRESS = `${PRESS_COLOR_TRANSITION} active:bg-button-filled-pressed-bg`;

/** 눌림 바탕색만(전환 없음) — PRESS_BOUNCE와 함께 걸 때 쓴다. */
export const NEUTRAL_BUTTON_PRESSED_BG = "active:bg-button-neutral-pressed-bg";
export const FILLED_BUTTON_PRESSED_BG = "active:bg-button-filled-pressed-bg";

/**
 * 누르는 동안 살짝(0.96) 눌렸다가(100ms) 놓으면 스프링으로 출렁이며 돌아온다(500ms).
 * 리액션 버튼용 REACTION_PRESS_MOTION(0.9)보다 얕다 — 큰 버튼·카드에도 쓸 수 있게.
 * transition-colors와 transition-[scale]은 같은 transition-property를 덮어써 함께 못 건다.
 * 그래서 색(120ms)·크기 전환을 한 줄에 같이 적었다(피드 카드와 같은 방식).
 * 눌림 색은 전환이 없는 *_PRESSED_BG와 함께 건다(*_BUTTON_PRESS와 같이 걸지 않는다).
 */
export const PRESS_BOUNCE =
  "motion-safe:[transition:scale_500ms_var(--ease-spring-wobbly),background-color_120ms_ease-out,color_120ms_ease-out,filter_120ms_ease-out] motion-safe:active:scale-96 motion-safe:active:[transition:scale_100ms_ease-out,background-color_120ms_ease-out,color_120ms_ease-out,filter_120ms_ease-out]";
