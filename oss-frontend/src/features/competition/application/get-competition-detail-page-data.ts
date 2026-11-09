import {
  createGetCompetitionDetailUseCase,
  createGetCompetitionInterestCountsUseCase,
  createGetCompetitionStoriesUseCase,
  createGetInterestedCompetitionIdsUseCase,
  createRecordCompetitionViewUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import {
  feeItemsOn,
  type CompetitionFeeItem,
} from "@/features/competition/domain/competition-fee";
import {
  detailStatusOn,
  scheduleOf,
  shouldPromptResult,
  type CompetitionDetailStatus,
  type CompetitionScheduleItem,
} from "@/features/competition/domain/competition-schedule";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";
import { toKstDateKey } from "@/shared/lib/time";

export type CompetitionDetailPageData =
  | {
      ok: true;
      competition: Competition;
      /** 대회 날짜 값이 틀렸으면 null — 상태 줄이 빠진다. */
      status: CompetitionDetailStatus | null;
      schedule: CompetitionScheduleItem[];
      fees: CompetitionFeeItem[];
      /** 오늘 — 한국 날짜 "YYYY-MM-DD" */
      today: string;
      currentYear: number;
      /** 내가 관심 등록했는지 — 비로그인이면 false */
      interested: boolean;
      interestCount: number;
      /** 이번 조회를 센 뒤의 조회수. 읽기 실패면 null — 숫자만 빠진다. */
      viewCount: number | null;
      /** 대회 이야기(#366). 읽기 실패면 null — 덩어리째 빠진다. */
      stories: CompetitionStory[] | null;
      /** 결과 남기기 배너를 띄울지(#368) */
      promptResult: boolean;
      /** 관심 대회 마감 알림 설정(#376). 비로그인이거나 못 읽으면 null */
      alertSettings: CompetitionAlertSettings | null;
    }
  | { ok: false; reason: "not-found" | "failed" };

/**
 * 대회 상세 화면 데이터 (#361~#368).
 *
 * 대회 자체를 못 읽으면 실패지만, 관심·조회수·대회 이야기는 못 읽어도 상세는 보여 준다 — 덧붙는 정보 하나 때문에
 * 화면 전체가 실패 화면이 되지 않게(목록과 같은 기준).
 * countView가 false면 조회수를 올리지 않는다 — 공유 미리보기를 만들 때처럼 사람이 연 게 아닐 때.
 */
export async function getCompetitionDetailPageData({
  competitionId,
  now,
  signedIn,
  countView = true,
}: {
  competitionId: string;
  now: number;
  signedIn: boolean;
  countView?: boolean;
}): Promise<CompetitionDetailPageData> {
  let competition: Competition | null;
  try {
    competition =
      await createGetCompetitionDetailUseCase().execute(competitionId);
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (!competition) return { ok: false, reason: "not-found" };

  const [interestedIds, interestCounts, viewCount, stories, alertSettings] =
    await Promise.all([
      signedIn
        ? safely(() => createGetInterestedCompetitionIdsUseCase().execute(), [])
        : Promise.resolve([] as string[]),
      safely(() => createGetCompetitionInterestCountsUseCase().execute(), {}),
      countView
        ? safely(
            () => createRecordCompetitionViewUseCase().execute(competitionId),
            null,
          )
        : Promise.resolve(null),
      safely(
        () => createGetCompetitionStoriesUseCase().execute(competitionId),
        null,
      ),
      signedIn ? loadCompetitionAlertSettings() : Promise.resolve(null),
    ]);

  const today = toKstDateKey(now);
  const status = detailStatusOn(competition, today);
  return {
    ok: true,
    competition,
    status,
    schedule: scheduleOf(competition, today),
    fees: feeItemsOn(competition.fees, today),
    today,
    currentYear: Number(today.slice(0, 4)),
    interested: interestedIds.includes(competition.id),
    interestCount:
      (interestCounts as Record<string, number>)[competition.id] ?? 0,
    viewCount,
    stories,
    promptResult: shouldPromptResult(status),
    alertSettings,
  };
}

async function safely<T, F>(
  load: () => Promise<T>,
  fallback: F,
): Promise<T | F> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}
