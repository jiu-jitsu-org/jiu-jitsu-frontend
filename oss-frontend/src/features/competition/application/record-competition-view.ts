import type { CompetitionViewRepository } from "@/features/competition/domain/competition-view-repository";

/** 대회 상세를 연 것으로 세고 조회수를 돌려준다(#362). */
export class RecordCompetitionViewUseCase {
  constructor(private readonly viewRepository: CompetitionViewRepository) {}

  async execute(competitionId: string): Promise<number> {
    return this.viewRepository.recordView(competitionId);
  }
}
