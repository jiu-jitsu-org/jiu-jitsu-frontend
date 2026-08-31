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
  "text-sm leading-[21px] text-reaction-bar-default-count-text group-active:text-reaction-bar-pressed-count-text";

/** Active(내가 누른/단) 상태의 카운트 텍스트 색. */
export const COMMENT_REACTION_TEXT_ACTIVE =
  "text-reaction-bar-active-count-text";

/**
 * 표시 전용(비활성) 버튼 — 외부 브라우저(비로그인)에서 로그인 기반 반응에 쓴다(#72).
 *
 * 누를 수 없으므로 Pressed·Active 상태가 없다. 색은 reaction-bar/disabled/* 패밀리.
 */
export const COMMENT_REACTION_READONLY =
  "inline-flex h-7 items-center gap-1 rounded-[10px] px-2 text-reaction-bar-disabled-icon";

/** 표시 전용 카운트/라벨 텍스트: Body S(14/21). */
export const COMMENT_REACTION_TEXT_READONLY =
  "text-sm leading-[21px] text-reaction-bar-disabled-count-text";
