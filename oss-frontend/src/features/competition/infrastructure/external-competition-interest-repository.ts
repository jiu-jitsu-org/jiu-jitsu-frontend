import type { CompetitionNoticeResult } from "@/features/competition/domain/competition-alert";
import type {
  CompetitionInterestRepository,
  CompetitionInterestResult,
} from "@/features/competition/domain/competition-interest-repository";
import { CompetitionNotFoundError } from "@/features/competition/domain/competition";
import {
  COMPETITION_NOT_FOUND_CODE,
  type Envelope,
} from "@/features/competition/infrastructure/competition-dto";
import { toApiError, type HttpClient } from "@/shared/lib/http";

/**
 * 대회 관심·이 대회 알림 API(backend#193, 로그인·멱등).
 *
 * - PUT|DELETE /competitions/{id}/interest → { competitionId, interested, interestCount }
 * - PUT|DELETE /competitions/{id}/notice   → { competitionId, interested, interestCount, noticeEnabled }
 *   PUT은 관심이 없으면 관심도 등록하고, DELETE는 관심을 그대로 둔다.
 * 없거나 미공개 대회(404 C0010)는 CompetitionNotFoundError로 바꿔 던진다.
 */
const COMPETITIONS_PATH = "/api/competitions";

type InterestDto = {
  competitionId: number;
  interested: boolean;
  interestCount: number;
};

type NoticeDto = InterestDto & { noticeEnabled: boolean };

export class ExternalCompetitionInterestRepository
  implements CompetitionInterestRepository
{
  constructor(private readonly httpClient: HttpClient) {}

  async setInterested(
    competitionId: number,
    interested: boolean,
  ): Promise<CompetitionInterestResult> {
    const options = { path: `${COMPETITIONS_PATH}/${competitionId}/interest` };
    const response = await notFoundAware(competitionId, () =>
      interested
        ? this.httpClient.put<Envelope<InterestDto>>(options)
        : this.httpClient.delete<Envelope<InterestDto>>(options),
    );
    return {
      interested: response.data.interested,
      interestCount: response.data.interestCount,
    };
  }

  async setNotice(
    competitionId: number,
    enabled: boolean,
  ): Promise<CompetitionNoticeResult> {
    const options = { path: `${COMPETITIONS_PATH}/${competitionId}/notice` };
    const response = await notFoundAware(competitionId, () =>
      enabled
        ? this.httpClient.put<Envelope<NoticeDto>>(options)
        : this.httpClient.delete<Envelope<NoticeDto>>(options),
    );
    return {
      interested: response.data.interested,
      interestCount: response.data.interestCount,
      noticeEnabled: response.data.noticeEnabled,
    };
  }
}

async function notFoundAware<T>(
  competitionId: number,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const apiError = toApiError(error);
    if (apiError.code === COMPETITION_NOT_FOUND_CODE) {
      throw new CompetitionNotFoundError(competitionId);
    }
    throw apiError;
  }
}
