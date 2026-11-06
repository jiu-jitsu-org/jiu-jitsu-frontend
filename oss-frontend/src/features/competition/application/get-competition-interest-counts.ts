import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/** 대회별 익명 관심 수 조회. 누가 눌렀는지는 없고 숫자만 있어 로그인 없이도 읽는다. */
export class GetCompetitionInterestCountsUseCase {
  constructor(
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  async execute(): Promise<Record<string, number>> {
    return this.interestRepository.getInterestCounts();
  }
}
