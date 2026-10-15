/**
 * 댓글 반응 버튼(답글·좋아요·⋮) 공통 클래스.
 *
 * 세 버튼이 서로 다른 파일(서버/클라이언트)에 흩어져 있어 클래스를 여기 한 곳에 모은다.
 * 상세 리액션바(PostActionBar)와 달리 기본 배경이 없는 가벼운 폼이고, 색은 reaction-bar/* 패밀리를 쓴다.
 *
 * - Default : icon reaction-bar/default/icon · text reaction-bar/default/count-text
 * - Pressed : bg reaction-bar/pressed/bg · icon reaction-bar/pressed/icon · text reaction-bar/pressed/count-text
 * - Active  : 배경 없음. 아이콘 fill + 종류별 active 토큰, 텍스트 reaction-bar/active/count-text
 *
 * group이 필요한 이유: :active는 눌린 요소와 그 조상에만 매칭돼 자식 span에는 안 걸린다.
 * 아이콘은 버튼의 currentColor를 상속하므로 버튼 자신의 `active:`로 충분하고,
 * 카운트 span만 group-active로 받는다.
 *
 * 상태 우선순위는 Pressed > Active > Default — Tailwind가 variant 유틸리티를 base 뒤에 배치한다.
 */

/** 버튼 공통: 높이 28, 좌우 8, 아이콘↔텍스트 4. radius는 상세 리액션바(10)와 맞춘다. */
export const COMMENT_REACTION_BUTTON =
  "group inline-flex h-7 items-center gap-1 rounded-[10px] px-2 active:bg-reaction-bar-pressed-bg active:text-reaction-bar-pressed-icon";

/** 아이콘 기본색 — 버튼에 걸어 아이콘이 currentColor로 상속받게 한다. */
export const COMMENT_REACTION_ICON = "text-reaction-bar-default-icon";

/** 카운트/라벨 텍스트: Body S(14/21). */
export const COMMENT_REACTION_TEXT =
  "text-body-s text-reaction-bar-default-count-text group-active:text-reaction-bar-pressed-count-text";

/**
 * 누르는 동안 살짝 눌렸다가(100ms) 놓으면 스프링으로 튀어 돌아온다(500ms).
 * 상세 리액션바·댓글 반응 버튼·댓글 등록 버튼이 함께 쓴다.
 */
export const REACTION_PRESS_MOTION =
  "motion-safe:transition-[scale] motion-safe:duration-500 motion-safe:ease-spring-wobbly motion-safe:active:scale-90 motion-safe:active:duration-100 motion-safe:active:ease-out";

/** 켜지는 순간(좋아요·저장) 아이콘이 톡 부풀었다 돌아온다 — usePopOnActivate와 함께. */
export const REACTION_POP_MOTION = "motion-safe:animate-reaction-pop";

/** Active(내가 누른/단) 상태의 카운트 텍스트 색. */
export const COMMENT_REACTION_TEXT_ACTIVE =
  "text-reaction-bar-active-count-text";
