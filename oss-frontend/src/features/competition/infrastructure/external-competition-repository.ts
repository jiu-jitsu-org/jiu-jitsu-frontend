import type {
  CompetitionListQuery,
  CompetitionPage,
} from "@/features/competition/domain/competition";
import type {
  CompetitionDetail,
  CompetitionPickerPage,
  CompetitionRepository,
} from "@/features/competition/domain/competition-repository";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";
import {
  COMPETITION_NOT_FOUND_CODE,
  toCompetition,
  toCompetitionDetail,
  toRegionCode,
  toRegions,
  toStatusCode,
  type CompetitionDetailDto,
  type CompetitionListDto,
  type CompetitionListItemDto,
  type CompetitionRegionsDto,
  type Envelope,
} from "@/features/competition/infrastructure/competition-dto";
import { toApiError, type HttpClient } from "@/shared/lib/http";
import { toKstIso } from "@/shared/lib/time";

/**
 * 업스트림 대회 API(competition-controller, backend#193) infrastructure 구현.
 *
 * - GET  /competitions               목록(비로그인 가능, 로그인이면 interested까지)
 * - GET  /competitions/{id}          상세(조회수 안 올림). 없거나 미공개 404 C0010
 * - POST /competitions/{id}/views    조회수 +1 → { competitionId, viewCount }
 * - GET  /competitions/{id}/stories  이 대회를 고른 글(BoardListResponse[], 최대 5)
 * - GET  /competitions/picker        글쓰기 대회 고르기 → { today, competitions } 최대 20
 * - GET  /competitions/regions       공개 대회(지난 대회 포함)가 있는 시·도 → { regions } (backend#206)
 *
 * 지역·상태는 여러 개를 쉼표로 이어 보낸다(region=SEOUL,BUSAN).
 */
const COMPETITIONS_PATH = "/api/competitions";

/** 지역 목록 묶어 두는 시간(초) */
const REGIONS_REVALIDATE_SECONDS = 300;

type CompetitionStoryDto = {
  id: number;
  title: string;
  commentCount: number | null;
  likeCount: number | null;
  createdAt: string;
};

export class ExternalCompetitionRepository implements CompetitionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getCompetitions(query: CompetitionListQuery): Promise<CompetitionPage> {
    const response = await this.httpClient.get<Envelope<CompetitionListDto>>({
      path: COMPETITIONS_PATH,
      query: {
        date: query.cursor ? undefined : query.date,
        cursor: query.cursor,
        size: query.size,
        region: query.regions?.length
          ? query.regions.map(toRegionCode).join(",")
          : undefined,
        status: query.statuses?.length
          ? query.statuses.map(toStatusCode).join(",")
          : undefined,
        interested: query.interested ? true : undefined,
        keyword: query.keyword || undefined,
      },
      cache: "no-store",
    });
    const data = response.data;
    return {
      today: data.today,
      competitions: (data.competitions ?? []).map(toCompetition),
      previousCursor: data.previousCursor ?? null,
      nextCursor: data.nextCursor ?? null,
    };
  }

  async getCompetition(id: number): Promise<CompetitionDetail | null> {
    try {
      const response = await this.httpClient.get<
        Envelope<CompetitionDetailDto>
      >({ path: `${COMPETITIONS_PATH}/${id}`, cache: "no-store" });
      return {
        competition: toCompetitionDetail(response.data),
        today: response.data.today,
      };
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === COMPETITION_NOT_FOUND_CODE) return null;
      throw apiError;
    }
  }

  async recordView(id: number): Promise<number> {
    const response = await this.httpClient.post<
      Envelope<{ competitionId: number; viewCount: number }>
    >({ path: `${COMPETITIONS_PATH}/${id}/views` });
    return response.data.viewCount;
  }

  async getStories(id: number): Promise<CompetitionStory[]> {
    const response = await this.httpClient.get<
      Envelope<CompetitionStoryDto[] | null>
    >({ path: `${COMPETITIONS_PATH}/${id}/stories`, cache: "no-store" });
    return (response.data ?? []).map((dto) => ({
      postId: dto.id,
      title: dto.title,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
      createdAt: toKstIso(dto.createdAt),
    }));
  }

  async getPickerCompetitions(keyword?: string): Promise<CompetitionPickerPage> {
    const response = await this.httpClient.get<
      Envelope<{ today: string; competitions: CompetitionListItemDto[] | null }>
    >({
      path: `${COMPETITIONS_PATH}/picker`,
      query: { keyword: keyword || undefined },
      cache: "no-store",
    });
    return {
      today: response.data.today,
      competitions: (response.data.competitions ?? []).map(toCompetition),
    };
  }

  async getRegions(): Promise<CompetitionRegion[]> {
    // 내 정보와 무관하고 대회가 새로 생길 때만 바뀌어 5분 묶어 둔다 — 목록 화면마다 부르면
    // 이 호출이 느릴 때 목록 첫 화면까지 늦어진다.
    const response = await this.httpClient.get<
      Envelope<CompetitionRegionsDto>
    >({
      path: `${COMPETITIONS_PATH}/regions`,
      // http 클라이언트 기본값이 no-store라 같이 주면 revalidate가 무시된다 — 캐시를 켜고 주기를 둔다.
      cache: "force-cache",
      next: { revalidate: REGIONS_REVALIDATE_SECONDS },
    });
    return toRegions(response.data.regions);
  }
}
