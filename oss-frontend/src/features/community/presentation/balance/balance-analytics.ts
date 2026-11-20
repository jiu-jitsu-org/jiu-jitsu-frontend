import type { BalanceOptionKey } from "@/features/community/domain/balance-game";
import { contentIdOf, track } from "@/shared/lib/analytics";

/**
 * 밸런스 게임 기록(GA, #581)의 이벤트와 꼬리표 값 — 사전 GA-11. 값은 사전에 적힌 것만 싣는다(닫힌 타입).
 * 서버가 투표를 처리한 뒤에만 부른다. 실패 · 체험 투표(`?sample=1`)는 남기지 않는다.
 */

/** 투표를 누른 곳(사전 `from`) — 홈 피드 카드 · 밸런스 상세. */
export type BalanceVoteFrom = "balance_card" | "balance_detail";

/**
 * 투표 요청 하나가 서버에 남은 뒤 한 번(`balance_vote`).
 * 동작은 응답의 투표 후 선택(after)으로 정한다 — 다른 기기에서 이미 투표해 화면(before)이 옛 상태여도
 * 서버가 실제로 한 일(취소 · 투표)과 맞는다. 투표 전 상태는 화면 값뿐이라 vote · change 구분만 그 값을 쓴다.
 * choice는 보낸 선택지(취소면 취소한 선택지)다.
 */
export function trackBalanceVote(
  contentId: number,
  before: BalanceOptionKey | null,
  after: BalanceOptionKey | null,
  sent: BalanceOptionKey,
  from: BalanceVoteFrom,
): void {
  track("balance_vote", {
    game_id: contentIdOf("balance_game", contentId),
    choice: sent === "A" ? "a" : "b",
    action: after === null ? "cancel" : before === null ? "vote" : "change",
    from,
  });
}
