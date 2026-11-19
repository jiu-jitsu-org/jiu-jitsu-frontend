import type { CommunityProfileRepository } from "@/features/community/domain/community-profile-repository";

/**
 * 내 대회 기록에 걸린 대회 id를 조회한다 (#545). 결과 남기기 배너 · 카드를 이미 기록한 대회에 다시 띄우지 않는 데 쓴다.
 */
export class GetMyRecordedCompetitionIdsUseCase {
  constructor(private readonly profileRepository: CommunityProfileRepository) {}

  async execute(): Promise<number[]> {
    return this.profileRepository.getMyRecordedCompetitionIds();
  }
}
