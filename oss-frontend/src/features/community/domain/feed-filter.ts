import {
  findCompetitionCategory,
  type PostCategory,
} from "@/features/community/domain/post";
import {
  FEED_PAGE_SIZE,
  type BoardListQuery,
} from "@/features/community/domain/post-summary";

/**
 * 홈 피드에서 지금 보는 목록(#590 · #598).
 *
 * - 전체: 둘 다 null — 지금 피드 그대로(오늘의 밸런스 게임 포함)
 * - 카테고리 탭: categoryId — 그 카테고리 글만(GET /board?boardListType=CATEGORY&categoryId=)
 * - 이 대회 글만: competitionId + '대회' 탭 — 카테고리와 상관없이 그 대회를 고른 글 전체
 *   (GET /board?boardListType=FEED&competitionId=, 대회 이야기 수와 같은 범위)
 *
 * 주소 쿼리가 정본이다 — `/?categoryId=3`, `/?competitionId=7`. 새로고침 · 앱이 연 주소(jiu-jitsu-ios#437)가 같은 목록으로 열린다.
 */
export type FeedFilter = {
  /** 고른 카테고리 탭. 전체면 null. 대회 조건이 있으면 '대회' 카테고리. */
  categoryId: number | null;
  /** 이 대회 글만 보는 중(#598). 없으면 null. */
  competitionId: number | null;
};

export const ALL_FEED: FeedFilter = { categoryId: null, competitionId: null };

/** 같은 목록인지 비교 · 목록을 새로 그릴 열쇠로 쓴다. */
export function feedFilterKey(filter: FeedFilter): string {
  return `${filter.categoryId ?? "all"}:${filter.competitionId ?? "-"}`;
}

/** 이 목록의 GET /board 조건(page는 0부터). */
export function boardListQueryOf(filter: FeedFilter, page = 0): BoardListQuery {
  const base = { page, size: FEED_PAGE_SIZE };
  if (filter.competitionId !== null) {
    return {
      ...base,
      boardListType: "FEED",
      competitionId: filter.competitionId,
    };
  }
  if (filter.categoryId !== null) {
    return {
      ...base,
      boardListType: "CATEGORY",
      categoryId: filter.categoryId,
    };
  }
  return { ...base, boardListType: "FEED" };
}

/** 이 목록을 여는 홈 주소의 쿼리. 전체면 "". */
export function feedFilterSearch(filter: FeedFilter): string {
  if (filter.competitionId !== null) {
    return `?competitionId=${filter.competitionId}`;
  }
  if (filter.categoryId !== null) return `?categoryId=${filter.categoryId}`;
  return "";
}

/** 양의 정수 문자열만 id로. */
function parsePositiveId(
  raw: string | string[] | null | undefined,
): number | null {
  if (typeof raw !== "string" || !/^\d{1,15}$/.test(raw.trim())) return null;
  const id = Number(raw.trim());
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * 주소 쿼리를 목록으로 좁힌다. 대회 조건이 카테고리보다 앞선다 — 대회 조건은 늘 '대회' 탭이다.
 * 목록에 없는 카테고리 · '대회' 카테고리가 없는 목록의 대회 조건은 버리고 전체로 연다.
 * 대회가 공개됐는지는 여기서 모른다 — application이 서버에 물어 확인한다.
 */
export function parseFeedFilter(
  raw: {
    categoryId?: string | string[] | null;
    competitionId?: string | string[] | null;
  },
  categories: PostCategory[],
): FeedFilter {
  const competitionId = parsePositiveId(raw.competitionId);
  if (competitionId !== null) {
    const competitionCategory = findCompetitionCategory(categories);
    return competitionCategory
      ? { categoryId: competitionCategory.id, competitionId }
      : ALL_FEED;
  }
  const categoryId = parsePositiveId(raw.categoryId);
  if (
    categoryId !== null &&
    categories.some((category) => category.id === categoryId)
  ) {
    return { categoryId, competitionId: null };
  }
  return ALL_FEED;
}
