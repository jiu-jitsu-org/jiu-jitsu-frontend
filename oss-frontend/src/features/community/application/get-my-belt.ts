import type { Belt } from "@/features/community/domain/belt";
import type { CommunityProfileRepository } from "@/features/community/domain/community-profile-repository";

/**
 * 내 띠·그랄을 조회한다 (#275). 띠 묻기 시트를 띄울지(띠가 없는 회원인지) 판단하는 데 쓴다.
 */
export class GetMyBeltUseCase {
  constructor(private readonly profileRepository: CommunityProfileRepository) {}

  async execute(): Promise<Belt | null> {
    return this.profileRepository.getMyBelt();
  }
}
