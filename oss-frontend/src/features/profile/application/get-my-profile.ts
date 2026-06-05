import type { UserProfile } from "@/features/profile/domain/profile";
import type { ProfileRepository } from "@/features/profile/domain/profile-repository";

/**
 * 현재 로그인한 사용자의 프로필을 조회한다.
 *
 * 토큰 부착은 infrastructure(authed HTTP client)에서 처리하므로, 이 use case는
 * 순수하게 "내 프로필 가져오기" 흐름만 담당한다.
 */
export class GetMyProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(): Promise<UserProfile> {
    return this.profileRepository.getMyProfile();
  }
}
