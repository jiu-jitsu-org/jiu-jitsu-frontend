import {
  CompetitionInfoReportLimitError,
  type CompetitionInfoReportReason,
  type CompetitionInfoReportRepository,
} from "@/features/competition/domain/competition-info-report";
import { CompetitionNotFoundError } from "@/features/competition/domain/competition";
import {
  COMPETITION_NOT_FOUND_CODE,
  type Envelope,
} from "@/features/competition/infrastructure/competition-dto";
import { toApiError, type HttpClient } from "@/shared/lib/http";

/**
 * "정보가 달라요" 제보 API(backend#194, 로그인) — POST /competitions/{id}/info-reports { field, detail? } → null.
 * 같은 대회·같은 항목을 하루 3번 넘게 보내면 400 R0010, 없거나 미공개 대회면 404 C0010.
 */
const COMPETITIONS_PATH = "/api/competitions";

const REPORT_LIMIT_EXCEEDED = "R0010";

const FIELD_BY_REASON: Record<CompetitionInfoReportReason, string> = {
  date: "SCHEDULE",
  place: "PLACE",
  schedule: "REGISTRATION",
  fee: "FEE",
  other: "OTHER",
};

export class ExternalCompetitionInfoReportRepository
  implements CompetitionInfoReportRepository
{
  constructor(private readonly httpClient: HttpClient) {}

  async report(
    competitionId: number,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void> {
    try {
      await this.httpClient.post<Envelope<null>>({
        path: `${COMPETITIONS_PATH}/${competitionId}/info-reports`,
        body: { field: FIELD_BY_REASON[reason], ...(detail ? { detail } : {}) },
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === REPORT_LIMIT_EXCEEDED) {
        throw new CompetitionInfoReportLimitError();
      }
      if (apiError.code === COMPETITION_NOT_FOUND_CODE) {
        throw new CompetitionNotFoundError(competitionId);
      }
      throw apiError;
    }
  }
}
