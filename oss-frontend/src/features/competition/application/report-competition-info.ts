import type {
  CompetitionInfoReportReason,
  CompetitionInfoReportRepository,
} from "@/features/competition/domain/competition-info-report";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import { UnknownCompetitionError } from "@/features/competition/application/set-competition-interest";

/**
 * 대회 정보 제보(#365). 있는 대회인지 먼저 본다 — Server Action은 누구나 부를 수 있어 아무 id나 쌓이지 않게.
 */
export class ReportCompetitionInfoUseCase {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly reportRepository: CompetitionInfoReportRepository,
  ) {}

  async execute(
    competitionId: string,
    reason: CompetitionInfoReportReason,
    detail?: string,
  ): Promise<void> {
    if (!(await this.competitionRepository.getCompetition(competitionId))) {
      throw new UnknownCompetitionError(competitionId);
    }
    await this.reportRepository.report(competitionId, reason, detail);
  }
}
