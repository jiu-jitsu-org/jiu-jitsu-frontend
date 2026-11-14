import type { BeltRank } from "@/features/community/domain/belt";
import {
  createGetCompetitionListUseCase,
  createGetCompetitionRegionsUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import { loadMyBeltRank } from "@/features/competition/application/load-my-belt-rank";
import {
  COMPETITION_FULL_PAGE_SIZE,
  COMPETITION_LIST_PAGE_SIZE,
  type Competition,
  type CompetitionListQuery,
  type CompetitionPage,
  type MonthGroup,
} from "@/features/competition/domain/competition";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import {
  COMPETITION_REGIONS,
  type CompetitionRegion,
} from "@/features/competition/domain/competition-region";
import {
  addDays,
  registrationStatusOf,
  type RegistrationStatus,
} from "@/features/competition/domain/competition-registration";
import {
  RESULT_CARD_DAYS,
  recentlyEndedInterested,
  type ResultCardGroup,
} from "@/features/competition/domain/competition-result-prompt";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";

export type CompetitionListItem = {
  competition: Competition;
  /** 보여 줄 접수 날짜를 모르는 대회는 null */
  registration: RegistrationStatus | null;
};

export type CompetitionListMonth = MonthGroup<CompetitionListItem>;

/** 목록 한 페이지 — 날짜순. 아래로 이어 받을 커서가 없으면 null. */
export type CompetitionListChunk = {
  /** 서버가 본 오늘 — 한국 날짜 "YYYY-MM-DD" */
  today: string;
  items: CompetitionListItem[];
  nextCursor: string | null;
};

export type CompetitionListPageData =
  | {
      ok: true;
      /** 오늘(포함) 이후 대회 첫 페이지 — 필터 없이. */
      list: CompetitionListChunk;
      currentYear: number;
      /** 오늘 — 응답의 today. 달력(#339)이 지난 날짜를 흐리게 하고 첫 달을 정할 때 쓴다. */
      today: string;
      /**
       * 다가오는 내 관심 대회(접수 예정·접수 중·접수 마감) — 곧 마감(#396)·곧 열려요 배너 후보. 비로그인·실패면 빈 배열.
       * 접수 예정·마감 대회도 싣는 것은 대회 날이 다가오면 '곧 열려요'로 알리기 위해서다.
       */
      interestedUpcoming: CompetitionListItem[];
      /** 관심 대회 마감 알림 설정(#375). 비로그인이거나 못 읽으면 null — 첫 관심 등록 시트가 뜨지 않는다. */
      alertSettings: CompetitionAlertSettings | null;
      /** 내 띠 — 관심 대회 머리의 캐릭터·그라데이션 색. 비로그인·미입력·실패면 null(흰띠로 그린다). */
      myBeltRank: BeltRank | null;
      /**
       * 끝난 지 며칠 안 된 내 관심 대회 묶음(#403) — 대회 탭 맨 위 결과 남기기 카드. 최근 순.
       * 끝난 대회는 목록에 없어 따로 싣는다. 비로그인이면 빈 배열.
       */
      endedInterested: ResultCardGroup[];
      /**
       * 지역 시트에서 고를 수 있는 시·도 — 공개 대회(지난 대회 포함)가 있는 곳(backend#206), 표준 순서.
       * 못 받았거나 비어 오면 17개 모두.
       */
      availableRegions: readonly CompetitionRegion[];
    }
  | { ok: false };

/**
 * 대회 탭 목록 화면 데이터 — 오늘(서버 기준) 이후 대회를 날짜순으로, 대회마다 접수 상태를 붙여서(#419).
 *
 * 필터·다음 페이지는 화면이 Server Action(loadCompetitionListChunk)으로 이어 받는다.
 * 로그인이면 곧 마감·곧 열려요 배너(관심 + 접수 예정·접수 중·접수 마감)와 결과 남기기 카드(관심 + 종료, 며칠 전부터)를 함께 읽는다 —
 * 둘은 덧붙는 정보라 못 읽어도 목록을 막지 않는다. 지역 시트의 고를 수 있는 지역도 같이 읽고, 못 읽으면 17개 모두 연다.
 */
export async function getCompetitionListPageData(): Promise<CompetitionListPageData> {
  const accessToken = await readSessionToken();
  // 끝난 관심 대회를 받기 시작할 날 — 정확한 오늘은 응답의 today로 다시 거른다(토요일 대회는 하루 더).
  const endedFrom = addDays(
    toKstDateKey(readServerNow()),
    -(RESULT_CARD_DAYS + 2),
  );
  try {
    const [
      page,
      interestedUpcoming,
      interestedEnded,
      alertSettings,
      myBeltRank,
      availableRegions,
    ] = await Promise.all([
      fetchPage({ size: COMPETITION_LIST_PAGE_SIZE }, accessToken),
      accessToken
        ? fetchPage(
            {
              interested: true,
              statuses: ["upcoming", "open", "closed"],
              size: COMPETITION_FULL_PAGE_SIZE,
            },
            accessToken,
          ).catch(() => null)
        : null,
      accessToken
        ? fetchPage(
            {
              interested: true,
              statuses: ["ended"],
              date: endedFrom,
              size: COMPETITION_FULL_PAGE_SIZE,
            },
            accessToken,
          ).catch(() => null)
        : null,
      accessToken ? loadCompetitionAlertSettings() : null,
      accessToken ? loadMyBeltRank() : null,
      createGetCompetitionRegionsUseCase()
        .execute()
        .catch(() => null),
    ]);
    const today = page.today;

    return {
      ok: true,
      list: toChunk(page),
      currentYear: Number(today.slice(0, 4)),
      today,
      interestedUpcoming: interestedUpcoming
        ? toChunk(interestedUpcoming).items
        : [],
      alertSettings,
      myBeltRank,
      endedInterested: interestedEnded
        ? recentlyEndedInterested(
            interestedEnded.competitions,
            new Set(interestedEnded.competitions.map(({ id }) => id)),
            today,
          )
        : [],
      // 못 받았거나 빈 목록이면(모르는 값만 왔을 때 포함) 시트가 전부 막히지 않게 17개 모두 연다.
      availableRegions: availableRegions?.length
        ? availableRegions
        : COMPETITION_REGIONS,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * 필터를 건 첫 페이지·다음 페이지·달력 한 달(#419) — 화면의 Server Action이 부른다.
 * 관심만 보기는 로그인해야 한다 — 비로그인이면 부르지 않고 실패로 돌려준다.
 *
 * 오늘 기준 첫 페이지가 비었는데 지난 대회가 있으면(지난 대회만 있는 지역 등) 바로 앞 페이지 — 가장 최근 지난 대회들 — 를
 * 대신 준다. 지역 시트는 지난 대회까지 세어 지역을 열어 두므로, 고른 지역이 빈 목록으로 끝나지 않게.
 * 아래로 이어 받을 오늘 이후 대회는 없어 다음 커서는 비운다.
 */
export async function loadCompetitionListChunk(
  query: CompetitionListQuery,
): Promise<
  | { ok: true; chunk: CompetitionListChunk }
  | { ok: false; reason: "unauthenticated" | "failed" }
> {
  const accessToken = await readSessionToken();
  if (query.interested && !accessToken) {
    return { ok: false, reason: "unauthenticated" };
  }
  try {
    const page = await fetchPage(query, accessToken);
    if (
      !query.cursor &&
      !query.date &&
      page.competitions.length === 0 &&
      page.previousCursor
    ) {
      const past = await fetchPage(
        { ...query, cursor: page.previousCursor },
        accessToken,
      );
      return { ok: true, chunk: { ...toChunk(past), nextCursor: null } };
    }
    return { ok: true, chunk: toChunk(page) };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/**
 * 로그인 토큰이 만료됐으면 익명으로 다시 읽는다 — 서버는 토큰을 갱신할 수 없고, 목록 자체는 익명으로도 볼 수 있다.
 * 관심만 보기는 익명으로 읽을 수 없어 그대로 실패한다.
 */
async function fetchPage(
  query: CompetitionListQuery,
  accessToken: string | null,
): Promise<CompetitionPage> {
  try {
    return await createGetCompetitionListUseCase(accessToken).execute(query);
  } catch (error) {
    if (
      accessToken &&
      !query.interested &&
      toApiError(error).code === ApiErrorCode.EXPIRED_TOKEN
    ) {
      return createGetCompetitionListUseCase(null).execute(query);
    }
    throw error;
  }
}

function toChunk(page: CompetitionPage): CompetitionListChunk {
  return {
    today: page.today,
    items: page.competitions.map((competition) => ({
      competition,
      registration: registrationStatusOf(competition, page.today),
    })),
    nextCursor: page.nextCursor,
  };
}
