"use client";

/**
 * 마지막으로 밸런스 게임에 투표한 시각 — 홈이 "처음 보일 때 재조회 건너뛰기"(#409)를 해도 되는지 판단한다.
 *
 * WHY 필요한가: 공유 링크·푸시로 앱을 켜면 홈이 한 번도 보이기 전에 상세가 그 위를 덮을 수 있다.
 * 상세에서 투표하고 돌아오면 그때가 홈의 첫 visible이라, 기록이 없으면 옛 seed가 그대로 남는다.
 *
 * WHY localStorage인가: 앱에서 상세는 다른 웹뷰다. sessionStorage는 웹뷰를 건너가지 못한다
 * (pending-toast와 같은 선택). 시각만 남기고 비교는 읽는 쪽이 하므로 지난 값이 남아 있어도 해가 없다.
 */
const BALANCE_VOTED_AT_KEY = "balance-voted-at";

export function markBalanceVoted(): void {
  try {
    window.localStorage.setItem(BALANCE_VOTED_AT_KEY, String(Date.now()));
  } catch {
    // 스토리지 차단 환경. 첫 복귀 갱신이 한 번 늦어질 뿐 화면이 깨지지는 않는다.
  }
}

/** since(ms) 이후에 투표한 적이 있으면 true. */
export function balanceVotedSince(since: number): boolean {
  try {
    const raw = window.localStorage.getItem(BALANCE_VOTED_AT_KEY);
    return raw !== null && Number(raw) >= since;
  } catch {
    return false;
  }
}
