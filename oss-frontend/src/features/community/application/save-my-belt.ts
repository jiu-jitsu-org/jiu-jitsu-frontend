import type { Belt } from "@/features/community/domain/belt";
import type { CommunityProfileRepository } from "@/features/community/domain/community-profile-repository";

/**
 * 띠 묻기 시트에서 고른 띠·그랄을 내 커뮤니티 프로필에 저장한다 (#275).
 *
 * 앱 MY의 띠·체급 입력과 같은 프로필 값을 고친다 — 시트에서 저장해도 MY에 그대로 보인다.
 */
export class SaveMyBeltUseCase {
  constructor(private readonly profileRepository: CommunityProfileRepository) {}

  async execute(belt: Belt): Promise<void> {
    await this.profileRepository.saveMyBelt(belt);
  }
}
