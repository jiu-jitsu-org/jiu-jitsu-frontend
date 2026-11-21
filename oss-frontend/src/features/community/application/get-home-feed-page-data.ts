import {
  getBoardListPageData,
  type BoardListPageDataResult,
} from "@/features/community/application/get-board-list-page-data";
import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import {
  ALL_FEED,
  boardListQueryOf,
  parseFeedFilter,
  type FeedFilter,
} from "@/features/community/domain/feed-filter";
import type { PostCategory } from "@/features/community/domain/post";
import { createGetCompetitionDetailUseCase } from "@/features/competition/application/competition-use-case-factory";
import {
  loadPickableCompetitionOptions,
  type CompetitionPickerOption,
} from "@/features/competition/application/get-competition-picker-options";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { readSessionToken } from "@/shared/lib/auth";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";

/** 이 대회 글만 보는 중(#598)에 '대회' 탭 위 고르기 칸에 보여 줄 대회. */
export type FeedCompetition = CompetitionPickerOption;

export type HomeFeedPageData = {
  /** 카테고리 탭(서버 순서, 실패면 폴백 6개). */
  categories: PostCategory[];
  /** 실제로 연 목록 — 못 여는 조건(없는 카테고리 · 미공개 대회)은 전체로 바뀌어 있다. */
  filter: FeedFilter;
  /** filter.competitionId의 대회. 없으면 null. */
  competition: FeedCompetition | null;
  /** '대회' 탭에서 대회별로 골라 볼 목록 — 글쓰기 대회 고르기와 같은 목록. 대회 화면이 꺼졌으면 빈 목록. */
  competitionOptions: CompetitionPickerOption[];
  /** 고르기 목록의 날짜를 올해면 연도 없이 쓰려고(KST). */
  currentYear: number;
  /** 첫 페이지. */
  result: BoardListPageDataResult;
};

/**
 * 홈 피드 Server Component용 페이지 쿼리(#590 · #598) — 카테고리 탭 · 고른 목록 첫 페이지 · 이 대회 이름 ·
 * '대회' 탭의 대회 고르기 목록(서버 메모리에 잠시 기억해 둔 값이라 거의 기다리지 않는다).
 *
 * 세 조회를 나란히 한다(순서대로 부르면 첫 화면이 그만큼 늦다). 주소의 대회가 없거나 미공개면 서버가 목록을
 * 404로 돌려주므로(backend#269) 대회 조회 결과로 먼저 가려 전체 피드로 다시 읽는다 — "공개 안 된 대회 번호면 일반 피드".
 * 대회 화면이 꺼진 배포는 대회 조건을 버린다.
 *
 * 탭을 바꾼 뒤 목록은 클라이언트가 BFF(GET /api/community/board)로 읽는다 — 이 쿼리는 첫 화면만.
 */
export async function getHomeFeedPageData(
  raw: {
    categoryId?: string | string[];
    competitionId?: string | string[];
  },
  sampleBelts = false,
): Promise<HomeFeedPageData> {
  const categories = await getPostCategoriesOrFallback();
  const requested = parseFeedFilter(
    {
      categoryId: raw.categoryId,
      competitionId: isCompetitionEnabled() ? raw.competitionId : undefined,
    },
    categories,
  );

  const [result, competition, competitionOptions] = await Promise.all([
    getBoardListPageData(boardListQueryOf(requested), sampleBelts),
    requested.competitionId === null
      ? null
      : loadFeedCompetition(requested.competitionId),
    loadPickableCompetitionOptions(),
  ]);
  const currentYear = Number(toKstDateKey(readServerNow()).slice(0, 4));

  if (requested.competitionId !== null && competition === null) {
    return {
      categories,
      filter: ALL_FEED,
      competition: null,
      competitionOptions,
      currentYear,
      result: await getBoardListPageData(
        boardListQueryOf(ALL_FEED),
        sampleBelts,
      ),
    };
  }

  return {
    categories,
    filter: requested,
    competition,
    competitionOptions,
    currentYear,
    result,
  };
}

/** 대회 이름을 읽는다. 없거나 미공개 · 조회 실패면 null — 호출부가 전체 피드로 연다. */
async function loadFeedCompetition(
  competitionId: number,
): Promise<FeedCompetition | null> {
  try {
    const detail = await createGetCompetitionDetailUseCase(
      await readSessionToken(),
    ).execute(competitionId);
    return detail
      ? {
          id: detail.competition.id,
          name: detail.competition.name,
          date: detail.competition.date,
          place: detail.competition.place,
        }
      : null;
  } catch (error) {
    console.error(
      "[community:home-feed] 대회 조회 실패 — 전체 피드로 연다:",
      competitionId,
      error,
    );
    return null;
  }
}
