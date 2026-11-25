import type { BalanceGame } from "@/features/community/domain/balance-game";

/**
 * 메인 홈 '어제의 밸런스 게임' 결과(#681) — 어제 판에 투표한 사람이 다음 날 홈에 처음 들어오면 오늘 판보다
 * 어제 판 결과를 먼저 보여 준다. 자정 ~ 00:30 교체 버퍼에 보이던 결과 화면을 다음 날 한 번 더 쓰는 것이다.
 *
 * 서버에 '어제 결과' 계약이 따로 없다 — 내가 투표한 판 목록(GET /community/balance-game/participated, 최신 판 먼저)에서
 * 어제 진행된 판을 찾는다. 오늘 판에 이미 투표했으면 목록 맨 앞이 오늘 판이라 앞의 몇 개를 훑는다.
 */

/** 참여 목록에서 훑을 개수 — 오늘 판 · 어제 판. */
export const YESTERDAY_LOOKUP_SIZE = 2;

/**
 * 어제 결과로 보여 줄 판. 없으면 null — 홈은 지금처럼 바로 오늘 판을 그린다.
 *
 * - 오늘 판이 진행 중일 때만: 교체 버퍼(closed)엔 홈이 이미 방금 끝난 판 결과를 보여 주고, 오늘 판이 없으면
 *   '오늘 판으로 넘어가기'가 갈 곳이 없다.
 * - 어제(yesterdayDate) 진행된 판 중 내가 투표했고 마감된 판. 진행 날짜(gameDate)가 없는 판은 어제인지 알 수 없어 뺀다.
 * - 이 기기에서 이미 본 날짜(seenDate)면 뺀다 — 다음 날 처음 들어왔을 때 한 번만.
 */
export function pickYesterdayResult({
  today,
  participated,
  yesterdayDate,
  seenDate,
}: {
  today: BalanceGame | null;
  participated: readonly BalanceGame[];
  /** 한국 날짜로 어제("YYYY-MM-DD"). */
  yesterdayDate: string;
  /** 이 기기에서 어제 결과를 이미 본 판의 진행 날짜. */
  seenDate: string | null;
}): BalanceGame | null {
  if (!today || today.closed || !today.started) return null;
  if (seenDate === yesterdayDate) return null;

  return (
    participated.find(
      (game) =>
        game.contentId !== today.contentId &&
        game.gameDate === yesterdayDate &&
        game.closed &&
        game.myVote !== null,
    ) ?? null
  );
}
