import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";
import type { CompetitionInterestRepository } from "@/features/competition/domain/competition-interest-repository";

/** 없는 대회에 관심 등록하려 할 때. */
export class UnknownCompetitionError extends Error {
  constructor(competitionId: string) {
    super(`Unknown competition: ${competitionId}`);
    this.name = "UnknownCompetitionError";
  }
}

/**
 * 관심 등록·해제. 로그인 확인은 호출부(Server Action)가 먼저 한다. 바뀐 뒤 관심 수를 돌려준다.
 *
 * 있는 대회인지 먼저 본다 — Server Action은 누구나 POST로 부를 수 있어, 아무 id나 쌓이지 않게 한다.
 * API가 나오면 이 확인은 서버가 하므로 빼도 된다.
 */
export class SetCompetitionInterestUseCase {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  async execute(competitionId: string, interested: boolean): Promise<number> {
    const competitions = await this.competitionRepository.getCompetitions();
    if (!competitions.some((competition) => competition.id === competitionId)) {
      throw new UnknownCompetitionError(competitionId);
    }
    return this.interestRepository.setInterested(competitionId, interested);
  }
}
