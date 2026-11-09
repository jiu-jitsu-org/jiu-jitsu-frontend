import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import {
  createGetCompetitionInterestCountsUseCase,
  createGetCompetitionListUseCase,
  createGetInterestedCompetitionIdsUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import {
  groupUpcomingByMonth,
  type Competition,
} from "@/features/competition/domain/competition";
import {
  COMPETITION_REGIONS,
  type CompetitionRegion,
} from "@/features/competition/domain/competition-region";
import {
  registrationStatusOn,
  type RegistrationStatus,
} from "@/features/competition/domain/competition-registration";
import { toKstDateKey } from "@/shared/lib/time";

export type CompetitionListItem = {
  competition: Competition;
  /** 접수 일정이 공지되지 않았거나 일정 값이 잘못된 대회는 null */
  registration: RegistrationStatus | null;
};

export type CompetitionListMonth = {
  year: number;
  month: number;
  items: CompetitionListItem[];
};

export type CompetitionListPageData =
  | {
      ok: true;
      months: CompetitionListMonth[];
      currentYear: number;
      /** 오늘 — 한국 날짜 "YYYY-MM-DD". 달력(#339)이 지난 날짜를 흐리게 하고 첫 달을 정할 때 쓴다. */
      today: string;
      /** 내가 관심 등록한 대회 id. 비로그인이면 빈 배열. */
      interestedIds: string[];
      /** 대회별 익명 관심 수(#335). 없는 대회는 0. 읽기 실패면 빈 객체 — 숫자만 안 보인다. */
      interestCounts: Record<string, number>;
      /** 예정 대회가 하나라도 있는 시·도 — 지역 시트에서 나머지는 고를 수 없게 둔다. 표준 순서. */
      regionsWithCompetitions: CompetitionRegion[];
      /** 관심 대회 마감 알림 설정(#375). 비로그인이거나 못 읽으면 null — 첫 관심 등록 시트가 뜨지 않는다. */
      alertSettings: CompetitionAlertSettings | null;
    }
  | { ok: false };

/**
 * 대회 탭 목록 화면 데이터 — 오늘(한국 날짜) 이후 대회를 월별로 묶어 가까운 날짜부터,
 * 대회마다 오늘 기준 접수 상태를 붙여서. 필터(#334)에 쓸 관심 목록·시·도도 함께 싣는다.
 *
 * now는 요청 시각(readServerNow). "오늘"과 "올해"를 서버 시각 하나로 정해 기기 시계와 어긋나지 않게 한다.
 * signedIn은 요청 쿠키로 본 로그인 여부 — 비로그인이면 관심 목록을 부르지 않는다.
 */
export async function getCompetitionListPageData({
  now,
  signedIn,
}: {
  now: number;
  signedIn: boolean;
}): Promise<CompetitionListPageData> {
  try {
    const [competitions, interestedIds, interestCounts, alertSettings] =
      await Promise.all([
        createGetCompetitionListUseCase().execute(),
        signedIn ? loadInterestedIds() : Promise.resolve([]),
        loadInterestCounts(),
        signedIn ? loadCompetitionAlertSettings() : Promise.resolve(null),
      ]);
    const today = toKstDateKey(now);
    const months = groupUpcomingByMonth(competitions, today);

    const regions = new Set(
      months.flatMap((month) =>
        month.competitions.flatMap((competition) =>
          competition.region ? [competition.region] : [],
        ),
      ),
    );

    return {
      ok: true,
      months: months.map((month) => ({
        year: month.year,
        month: month.month,
        items: month.competitions.map((competition) => ({
          competition,
          registration: competition.registration
            ? registrationStatusOn(competition.registration, today)
            : null,
        })),
      })),
      currentYear: Number(today.slice(0, 4)),
      today,
      interestedIds,
      interestCounts,
      regionsWithCompetitions: COMPETITION_REGIONS.filter((region) =>
        regions.has(region),
      ),
      alertSettings,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * 관심 목록을 못 읽어도 대회 목록은 보여 준다 — 관심 필터 하나 때문에 탭 전체가 실패 화면이 되지 않게.
 * 이때 관심 필터는 결과가 비어 "조건에 맞는 대회가 없어요"로 보인다.
 */
async function loadInterestedIds(): Promise<string[]> {
  try {
    return await createGetInterestedCompetitionIdsUseCase().execute();
  } catch {
    return [];
  }
}

/** 관심 수도 목록을 막지 않는다 — 못 읽으면 숫자만 빠진다. */
async function loadInterestCounts(): Promise<Record<string, number>> {
  try {
    return await createGetCompetitionInterestCountsUseCase().execute();
  } catch {
    return {};
  }
}
