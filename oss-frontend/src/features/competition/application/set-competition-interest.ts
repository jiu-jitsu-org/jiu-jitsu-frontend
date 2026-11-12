import type {
  CompetitionInterestRepository,
  CompetitionInterestResult,
} from "@/features/competition/domain/competition-interest-repository";

/**
 * 관심 등록·해제(#335). 로그인 확인은 호출부(Server Action)가 먼저 한다. 여러 번 불러도 같은 결과다.
 * 없거나 미공개 대회는 서버가 404(C0010)로 막는다.
 */
export class SetCompetitionInterestUseCase {
  constructor(
    private readonly interestRepository: CompetitionInterestRepository,
  ) {}

  execute(
    competitionId: number,
    interested: boolean,
  ): Promise<CompetitionInterestResult> {
    return this.interestRepository.setInterested(competitionId, interested);
  }
}
