import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/** 대회 하나 조회(#361). 로그인 없이도 볼 수 있다. 없는 대회면 null. */
export class GetCompetitionDetailUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  async execute(competitionId: string): Promise<Competition | null> {
    return this.competitionRepository.getCompetition(competitionId);
  }
}
