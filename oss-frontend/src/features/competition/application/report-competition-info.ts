import type {
  CompetitionInfoReportReason,
  CompetitionInfoReportRepository,
} from "@/features/competition/domain/competition-info-report";

/** 대회 정보 제보(#365 · #420). 있는 대회인지·하루 횟수는 서버가 본다. */
export class ReportCompetitionInfoUseCase {
  constructor(
    private readonly reportRepository: CompetitionInfoReportRepository,
  ) {}

  execute(
    competitionId: number,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void> {
    return this.reportRepository.report(competitionId, reason, detail);
  }
}
