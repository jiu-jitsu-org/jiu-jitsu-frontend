import type { BlockedMember } from "@/features/community/domain/blocked-member";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 내가 차단한 회원 목록을 조회한다(설정 > 차단한 회원).
 *
 * 로그인 전용이라 factory가 authed repository로만 조립한다. 해제는 차단과 같은 토글
 * (BlockUserUseCase)을 그대로 쓴다.
 */
export class GetBlockedMembersUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(): Promise<BlockedMember[]> {
    return this.writeRepository.getBlockedMembers();
  }
}
