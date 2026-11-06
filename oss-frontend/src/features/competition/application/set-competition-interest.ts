import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/** 관심 등록·해제. 로그인 확인은 호출부(Server Action)가 먼저 한다. 바뀐 뒤 관심 수를 돌려준다. */
export class SetCompetitionInterestUseCase {
  constructor(
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  async execute(competitionId: string, interested: boolean): Promise<number> {
    return this.interestRepository.setInterested(competitionId, interested);
  }
}
