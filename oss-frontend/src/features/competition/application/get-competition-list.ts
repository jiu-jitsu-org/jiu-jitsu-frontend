import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/** 대회 목록 조회. 로그인 없이도 볼 수 있다. */
export class GetCompetitionListUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  async execute(): Promise<Competition[]> {
    return this.competitionRepository.getCompetitions();
  }
}
