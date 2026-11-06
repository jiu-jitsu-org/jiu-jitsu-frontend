import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/** 내가 관심 등록한 대회 id 조회. 로그인한 사용자만 부른다. */
export class GetInterestedCompetitionIdsUseCase {
  constructor(
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  async execute(): Promise<string[]> {
    return this.interestRepository.getInterestedCompetitionIds();
  }
}
