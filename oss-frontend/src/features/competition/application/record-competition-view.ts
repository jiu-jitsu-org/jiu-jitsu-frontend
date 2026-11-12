import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/** 대회 상세를 연 것으로 세고 조회수를 돌려준다(#362). 사람이 화면을 열었을 때만 부른다. */
export class RecordCompetitionViewUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(competitionId: number): Promise<number> {
    return this.competitionRepository.recordView(competitionId);
  }
}
