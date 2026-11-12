import type {
  CompetitionDetail,
  CompetitionRepository,
} from "@/features/competition/domain/competition-repository";

/** 대회 하나 조회(#361). 로그인 없이도 볼 수 있다. 없거나 미공개면 null. 조회수는 올리지 않는다. */
export class GetCompetitionDetailUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(competitionId: number): Promise<CompetitionDetail | null> {
    return this.competitionRepository.getCompetition(competitionId);
  }
}
