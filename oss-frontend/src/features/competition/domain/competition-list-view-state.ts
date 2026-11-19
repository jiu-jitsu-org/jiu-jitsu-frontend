import {
  EMPTY_COMPETITION_FILTER,
  type CompetitionFilter,
} from "@/features/competition/domain/competition-filter";
import {
  COMPETITION_REGIONS,
  type CompetitionRegion,
} from "@/features/competition/domain/competition-region";

/**
 * 대회 탭에서 고른 필터 · 보기 방식 · 달력에서 보던 달을 주소(쿼리)에 담는 규칙 (#539).
 *
 * 앱의 당겨서 새로고침은 웹뷰를 지금 주소 그대로 다시 불러온다(webView.reload). 고른 값을 쿼리에 두면 서버가 처음부터
 * 그 조건으로 그려, 필터 없는 목록이 잠깐 보였다가 바뀌지 않는다. 앱을 다시 켜면 기본 주소로 열려 처음 상태다.
 *
 * | 값 | 쿼리 |
 * |---|---|
 * | 지역 | `region=seoul,gyeonggi` (표준 순서) |
 * | 접수 중 | `open=1` |
 * | 관심 | `interest=1` — 로그인일 때만 살린다 |
 * | 달력 보기 | `view=calendar` (목록이 기본이라 목록이면 뺀다) |
 * | 달력에서 보던 달 | `month=2027-03` — 달력일 때만 |
 *
 * 이름 검색어는 담지 않는다 — 닫으면 지우는 값이라, 안 보이는 검색어로 걸러지지 않게.
 * 맞지 않는 값(모르는 지역 · 고를 수 없는 지역 · 잘못된 달 · 지난 달)은 그 값만 버리고 나머지로 그린다.
 */

export type CompetitionListMode = "list" | "calendar";

export type YearMonth = { year: number; month: number };

export type CompetitionListViewState = {
  /** 이름 검색어는 늘 빈 값이다. */
  filter: CompetitionFilter;
  mode: CompetitionListMode;
  /** 달력에서 보던 달 — 달력이 아니거나 모르면 null. */
  month: YearMonth | null;
};

export const DEFAULT_COMPETITION_LIST_VIEW_STATE: CompetitionListViewState = {
  filter: EMPTY_COMPETITION_FILTER,
  mode: "list",
  month: null,
};

/** 쿼리의 지역 이름 — 서버 지역 값(SEOUL)을 소문자로. 사람이 읽을 수 있고 주소에서 퍼센트 인코딩되지 않는다. */
const REGION_SLUGS: Record<CompetitionRegion, string> = {
  서울: "seoul",
  부산: "busan",
  대구: "daegu",
  인천: "incheon",
  광주: "gwangju",
  대전: "daejeon",
  울산: "ulsan",
  세종: "sejong",
  경기: "gyeonggi",
  강원: "gangwon",
  충북: "chungbuk",
  충남: "chungnam",
  전북: "jeonbuk",
  전남: "jeonnam",
  경북: "gyeongbuk",
  경남: "gyeongnam",
  제주: "jeju",
};

const REGION_BY_SLUG = new Map(
  COMPETITION_REGIONS.map((region) => [REGION_SLUGS[region], region]),
);

type SearchParamValue = string | string[] | undefined;

/**
 * 주소 쿼리 → 처음 그릴 필터 · 보기 · 달.
 *
 * @param params Next.js searchParams 모양(같은 이름이 여럿이면 첫 값만 본다)
 * @param options.signedIn 로그아웃이면 관심 필터는 버린다 — 켜 봐야 늘 빈 결과다.
 * @param options.availableRegions 지역 시트에서 고를 수 있는 시 · 도 — 이제 고를 수 없는 지역은 버린다.
 * @param options.today 한국 날짜 "YYYY-MM-DD" — 이번 달보다 앞 달은 달력이 열 수 없어 버린다.
 */
export function parseCompetitionListViewState(
  params: Readonly<Record<string, SearchParamValue>>,
  options: {
    signedIn: boolean;
    availableRegions: readonly CompetitionRegion[];
    today: string;
  },
): CompetitionListViewState {
  const available = new Set(options.availableRegions);
  const picked = new Set(
    (first(params.region) ?? "")
      .split(",")
      .map((slug) => REGION_BY_SLUG.get(slug.trim().toLowerCase()))
      .filter(
        (region): region is CompetitionRegion =>
          region !== undefined && available.has(region),
      ),
  );
  const mode: CompetitionListMode =
    first(params.view) === "calendar" ? "calendar" : "list";
  const month = mode === "calendar" ? parseMonth(first(params.month)) : null;
  const thisMonth = parseMonth(options.today.slice(0, 7));

  return {
    filter: {
      ...EMPTY_COMPETITION_FILTER,
      // 시트와 같은 표준 순서로 — 칩 이름("서울 외 2")이 고른 순서와 무관하게 같게.
      regions: COMPETITION_REGIONS.filter((region) => picked.has(region)),
      openOnly: first(params.open) === "1",
      interestedOnly: options.signedIn && first(params.interest) === "1",
    },
    mode,
    month:
      month && thisMonth && compareYearMonth(month, thisMonth) >= 0
        ? month
        : null,
  };
}

/** 필터 · 보기 · 달 → 주소 쿼리("?region=seoul&view=calendar"). 모두 기본값이면 빈 문자열. */
export function competitionListViewSearch(
  state: CompetitionListViewState,
): string {
  const parts: string[] = [];
  const { filter, mode, month } = state;
  if (filter.regions.length > 0) {
    const regions = COMPETITION_REGIONS.filter((region) =>
      filter.regions.includes(region),
    );
    parts.push(
      `region=${regions.map((region) => REGION_SLUGS[region]).join(",")}`,
    );
  }
  if (filter.openOnly) parts.push("open=1");
  if (filter.interestedOnly) parts.push("interest=1");
  if (mode === "calendar") {
    parts.push("view=calendar");
    if (month) parts.push(`month=${month.year}-${pad(month.month)}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** "2027-03" → { year: 2027, month: 3 }. 모양이 틀리거나 없는 달(13월)이면 null. */
function parseMonth(value: string | undefined): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
