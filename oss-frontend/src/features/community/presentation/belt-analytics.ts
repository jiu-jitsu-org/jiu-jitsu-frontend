import type { Belt } from "@/features/community/domain/belt";
import { track } from "@/shared/lib/analytics";

/**
 * 띠 묻기 · 띠 저장 기록(GA, #582)의 이벤트와 꼬리표 값 — 사전 GA-12. 값은 사전에 적힌 것만 싣는다(닫힌 타입).
 * 웹에서 띠를 저장하는 곳은 띠 묻기 시트뿐이다. 프로필 · MY의 띠 저장은 앱 화면이라 iOS 몫(#429).
 */

/** 띠 묻기 시트를 연 계기(사전 `from`) — 글 등록 직후 · 댓글 등록 직후. */
export type BeltPromptTrigger = "post_create" | "comment_create";

/** 시트가 뜸(view) · 저장 성공(save) · 나중에 또는 바깥을 눌러 닫음(later). */
export type BeltPromptAction = "view" | "save" | "later";

/** 띠 묻기 시트가 뜨거나 답했다(`belt_prompt`). save는 서버가 저장한 뒤에만 — 실패하면 시트가 열린 채 남는다. */
export function trackBeltPrompt(
  action: BeltPromptAction,
  from: BeltPromptTrigger,
): void {
  track("belt_prompt", { action, from });
}

/**
 * 띠 · 그랄이 저장됐다(`belt_update`). 시트는 서버에 띠가 없을 때만 열리므로 웹의 저장은 늘 첫 입력(first_set)이다.
 * 사용자 속성(belt · stripes)은 앱이 이 기록을 받을 때 갱신한다(iOS #429).
 */
export function trackBeltUpdate(belt: Belt): void {
  track("belt_update", {
    change: "first_set",
    belt: belt.rank,
    stripes: belt.grau,
    from: "belt_prompt",
  });
}
