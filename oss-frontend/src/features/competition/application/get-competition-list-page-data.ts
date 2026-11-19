import type { BeltRank } from "@/features/community/domain/belt";
import {
  createGetCompetitionListUseCase,
  createGetCompetitionRegionsUseCase,
} from "@/features/competition/application/competition-use-case-factory";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import { loadMyBeltRank } from "@/features/competition/application/load-my-belt-rank";
import { loadMyRecordedCompetitionIds } from "@/features/competition/application/load-my-recorded-competitions";
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
  competitionListQueryOf,
  isCompetitionFilterEmpty,
} from "@/features/competition/domain/competition-filter";
import {
  parseCompetitionListViewState,
  type CompetitionListViewState,
} from "@/features/competition/domain/competition-list-view-state";
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
  withoutRecorded,
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
       * 끝난 대회는 목록에 없어 따로 싣는다. 비로그인이면 빈 배열. 이미 내 대회 기록에 남긴 대회는 뺀다(#545).
       */
      endedInterested: ResultCardGroup[];
      /**
       * 지역 시트에서 고를 수 있는 시·도 — 공개 대회(지난 대회 포함)가 있는 곳(backend#206), 표준 순서.
       * 못 받았거나 비어 오면 17개 모두.
       */
      availableRegions: readonly CompetitionRegion[];
      /** 주소 쿼리로 처음 그릴 필터 · 보기 · 달(#539) — 당겨서 새로고침해도 고른 값 그대로 연다. */
      initialView: CompetitionListViewState;
      /** initialView 필터로 받은 첫 페이지 — 필터가 없거나 못 받았으면 null(화면이 받는다). */
      initialFiltered: CompetitionListChunk | null;
      /** 달력으로 열 때 보던 달을 미리 받은 것 — 달력이 아니거나 못 받았으면 null(달력이 받는다). */
      initialCalendarMonth: CompetitionListChunk | null;
    }
  | { ok: false; reason: "session-expired" | "failed" };

/** Next.js searchParams 모양 */
export type CompetitionListSearchParams = Readonly<
  Record<string, string | string[] | undefined>
>;

/** 여러 날 대회의 첫날이 마지막 날보다 앞설 수 있는 여유 — 대회는 길어야 며칠이다. */
const MULTI_DAY_LOOKBACK_DAYS = 7;

/**
 * 대회 탭 목록 화면 데이터 — 오늘(서버 기준) 이후 대회를 날짜순으로, 대회마다 접수 상태를 붙여서(#419).
 *
 * 필터·다음 페이지는 화면이 Server Action(loadCompetitionListChunk)으로 이어 받는다.
 * 로그인이면 곧 마감·곧 열려요 배너(관심 + 접수 예정·접수 중·접수 마감)와 결과 남기기 카드(관심 + 종료, 며칠 전부터)를 함께 읽는다 —
 * 둘은 덧붙는 정보라 못 읽어도 목록을 막지 않는다. 지역 시트의 고를 수 있는 지역도 같이 읽고, 못 읽으면 17개 모두 연다.
 *
 * 주소 쿼리에 고른 필터 · 달력 보기가 있으면(#539) 그 조건의 첫 페이지와 보던 달도 함께 받아, 화면이 처음부터 그 조건으로
 * 그린다. 이것도 못 받으면 화면이 다시 받는다. 필터 없는 첫 페이지(list)는 그대로 받는다 — 필터를 풀었을 때 · 배너 후보에 쓴다.
 */
export async function getCompetitionListPageData(
  searchParams: CompetitionListSearchParams = {},
): Promise<CompetitionListPageData> {
  const accessToken = await readSessionToken();
  const serverToday = toKstDateKey(readServerNow());
  // 고를 수 있는 지역은 함께 받으므로 먼저 17개 기준으로 읽고, 받은 뒤 고를 수 없는 지역이 섞였으면 빼고 다시 받는다(드묾).
  const requestedView = parseCompetitionListViewState(searchParams, {
    signedIn: accessToken !== null,
    availableRegions: COMPETITION_REGIONS,
    today: serverToday,
  });
  // 끝난 관심 대회를 받기 시작할 날 — 정확한 오늘은 응답의 today로 다시 거른다(토요일 대회는 하루 더).
  // 목록은 첫날 기준이라, 마지막 날로 거르는 여러 날 대회(backend#227)가 빠지지 않게 일주일 더 앞에서 받는다.
  const endedFrom = addDays(
    serverToday,
    -(RESULT_CARD_DAYS + 2 + MULTI_DAY_LOOKBACK_DAYS),
  );
  try {
    const [
      page,
      interestedUpcoming,
      interestedEnded,
      alertSettings,
      myBeltRank,
      availableRegions,
      recordedIds,
      requestedFiltered,
      requestedCalendarMonth,
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
      accessToken ? loadMyRecordedCompetitionIds() : null,
      loadInitialFiltered(requestedView),
      loadInitialCalendarMonth(requestedView),
    ]);
    const today = page.today;
    // 못 받았거나 빈 목록이면(모르는 값만 왔을 때 포함) 시트가 전부 막히지 않게 17개 모두 연다.
    const regions = availableRegions?.length
      ? availableRegions
      : COMPETITION_REGIONS;
    const initialView = parseCompetitionListViewState(searchParams, {
      signedIn: accessToken !== null,
      availableRegions: regions,
      today,
    });
    const sameFilter =
      initialView.filter.regions.length === requestedView.filter.regions.length;
    const [initialFiltered, initialCalendarMonth] = sameFilter
      ? [requestedFiltered, requestedCalendarMonth]
      : await Promise.all([
          loadInitialFiltered(initialView),
          loadInitialCalendarMonth(initialView),
        ]);

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
        ? withoutRecorded(
            recentlyEndedInterested(
              interestedEnded.competitions,
              new Set(interestedEnded.competitions.map(({ id }) => id)),
              today,
            ),
            recordedIds,
          )
        : [],
      availableRegions: regions,
      initialView,
      initialFiltered,
      // 서버의 오늘로 다시 보니 지난 달이 됐으면(자정 무렵) 달도 빠져 있다 — 받은 달을 버린다.
      initialCalendarMonth: initialView.month ? initialCalendarMonth : null,
    };
  } catch (error) {
    // 만료 토큰이면 익명으로 내리지 않고 화면의 복구(앱 갱신 → 다시 그리기)에 맡긴다 — 글 상세와 같은 방식(#524).
    return {
      ok: false,
      reason: isExpiredToken(error) ? "session-expired" : "failed",
    };
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
  | { ok: false; reason: "unauthenticated" | "expired" | "failed" }
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
  } catch (error) {
    // 만료 토큰이면 화면이 앱에 갱신을 맡기고 다시 부른다 — 익명으로 받은 결과로 관심 상태를 덮지 않게(#524).
    return { ok: false, reason: isExpiredToken(error) ? "expired" : "failed" };
  }
}

/** 주소 쿼리 필터의 첫 페이지 — 화면이 칩을 눌렀을 때 받는 것과 같다. 필터가 없거나 못 받으면 null. */
async function loadInitialFiltered(
  view: CompetitionListViewState,
): Promise<CompetitionListChunk | null> {
  if (isCompetitionFilterEmpty(view.filter)) return null;
  const result = await loadCompetitionListChunk({
    ...competitionListQueryOf(view.filter),
    size: COMPETITION_LIST_PAGE_SIZE,
  });
  return result.ok ? result.chunk : null;
}

/** 주소 쿼리의 달력 달 — 달력이 그 달로 넘겼을 때 받는 것과 같다(1일부터 한 번에). 달이 없거나 못 받으면 null. */
async function loadInitialCalendarMonth(
  view: CompetitionListViewState,
): Promise<CompetitionListChunk | null> {
  if (!view.month) return null;
  const { year, month } = view.month;
  const result = await loadCompetitionListChunk({
    ...competitionListQueryOf(view.filter),
    date: `${year}-${String(month).padStart(2, "0")}-01`,
    size: COMPETITION_FULL_PAGE_SIZE,
  });
  return result.ok ? result.chunk : null;
}

/**
 * 목록 한 페이지. 로그인 토큰이 만료돼도 익명으로 다시 읽지 않는다 — 익명 결과는 관심이 모두 빠져 화면의 관심 상태를
 * 덮는다(#524). 서버는 토큰을 갱신할 수 없어 만료를 그대로 올리고, 화면이 앱에 갱신을 맡긴다.
 */
function fetchPage(
  query: CompetitionListQuery,
  accessToken: string | null,
): Promise<CompetitionPage> {
  return createGetCompetitionListUseCase(accessToken).execute(query);
}

function isExpiredToken(error: unknown): boolean {
  return toApiError(error).code === ApiErrorCode.EXPIRED_TOKEN;
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
