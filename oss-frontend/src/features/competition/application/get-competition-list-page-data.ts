import { createGetCompetitionListUseCase } from "@/features/competition/application/competition-use-case-factory";
import {
  groupUpcomingByMonth,
  type CompetitionMonth,
} from "@/features/competition/domain/competition";
import { toKstDateKey } from "@/shared/lib/time";

export type CompetitionListPageData =
  | { ok: true; months: CompetitionMonth[]; currentYear: number }
  | { ok: false };

/**
 * 대회 탭 목록 화면 데이터 — 오늘(한국 날짜) 이후 대회를 월별로 묶어 가까운 날짜부터.
 *
 * now는 요청 시각(readServerNow). "오늘"과 "올해"를 서버 시각 하나로 정해 기기 시계와 어긋나지 않게 한다.
 */
export async function getCompetitionListPageData(
  now: number,
): Promise<CompetitionListPageData> {
  try {
    const competitions = await createGetCompetitionListUseCase().execute();
    const today = toKstDateKey(now);

    return {
      ok: true,
      months: groupUpcomingByMonth(competitions, today),
      currentYear: Number(today.slice(0, 4)),
    };
  } catch {
    return { ok: false };
  }
}
