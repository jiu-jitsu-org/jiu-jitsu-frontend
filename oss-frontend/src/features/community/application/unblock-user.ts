import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 차단한 회원의 차단을 푼다(설정 > 차단한 회원).
 *
 * 차단(BlockUserUseCase)의 토글과 달리 해제 전용 호출이다 — 다른 기기에서 이미 풀었어도 다시
 * 차단되지 않고 성공한다.
 */
export class UnblockUserUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(userId: number): Promise<void> {
    await this.writeRepository.unblock(userId);
  }
}
