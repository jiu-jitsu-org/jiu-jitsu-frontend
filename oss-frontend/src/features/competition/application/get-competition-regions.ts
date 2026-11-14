import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/** 지역 시트에서 고를 수 있는 시·도 — 공개 대회(지난 대회 포함)가 하나라도 있는 곳(backend#206). 로그인 없이 읽는다. */
export class GetCompetitionRegionsUseCase {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  execute(): Promise<CompetitionRegion[]> {
    return this.competitionRepository.getRegions();
  }
}
