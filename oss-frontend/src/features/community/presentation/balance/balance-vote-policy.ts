import type {
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";

/**
 * 밸런스 게임 투표 정책 — 뒤집힐 것을 전제로 한 곳에 모아 둔다.
 *
 * 업스트림은 이미 취소(같은 선택지 재전송)와 변경(다른 선택지)을 **둘 다** 지원한다.
 * 무엇을 막을지는 순전히 화면 정책이라 서버가 지켜주지 않는다 → 여기가 유일한 경계다.
 *
 * 투표 훅(판단)과 선택지 버튼(커서 표현)이 같은 답을 내야 해서, 두 곳이 함께 읽도록
 * 훅 바깥의 순수 모듈로 뺐다. 훅에 두면 뷰가 훅을 부르려고 상태를 갖게 된다.
 */
export const BALANCE_VOTE_POLICY = {
  /**
   * 이미 고른 선택지를 다시 눌러 **취소**.
   *
   * 기획 원안은 "한 번 투표하면 끝"이라 불가였다. 테스트 중 한 번 누르면 되돌릴 수 없어
   * 확인이 어렵다는 문제가 있어 우선 열어 둔다. 기획자에게 정책 수정을 요청할 예정이며,
   * 원안대로 확정되면 이 값만 false로 되돌린다.
   */
  allowCancel: true,
  /**
   * 다른 선택지를 눌러 **변경**.
   *
   * 기획 확정 전까지 막는다. 취소 후 다시 고르는 두 탭 경로는 열려 있으므로, 확인에
   * 필요한 동선은 allowCancel만으로 충분하다.
   */
  allowChange: false,
} as const;

/**
 * 이 선택지를 눌렀을 때 투표 상태가 바뀔 수 있는가.
 *
 * 로그인 여부·마감 여부는 보지 않는다 — 그건 정책이 아니라 상황이라 호출부가 따로 판단한다.
 */
export function canToggleVote(
  myVote: BalanceOptionKey | null,
  option: BalanceOptionKey,
): boolean {
  if (myVote === null) return true;

  return myVote === option
    ? BALANCE_VOTE_POLICY.allowCancel
    : BALANCE_VOTE_POLICY.allowChange;
}

/**
 * 투표 후의 선택 상태. 같은 선택지를 다시 누르면 취소(null)다.
 *
 * 업스트림 규약과 같은 규칙이라, 낙관적 반영값이 서버 확정값과 어긋나지 않는다.
 */
export function nextVoteOf(
  myVote: BalanceOptionKey | null,
  option: BalanceOptionKey,
): BalanceOptionKey | null {
  return myVote === option ? null : option;
}
