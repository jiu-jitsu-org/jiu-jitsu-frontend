import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 글 · 밸런스 게임 상세를 사람이 연 것으로 세고 센 뒤 조회수를 돌려준다(#523, 대회 #362와 같은 방식).
 * 상세 조회는 화면을 맞추려고 같은 방문 안에서 여러 번 불리므로 조회수를 올리지 않는다 — 상세 화면이 처음 그려질 때 한 번만 부른다.
 */
export class RecordPostViewUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(postId: number): Promise<number> {
    return this.postRepository.recordView(postId);
  }
}

export class RecordBalanceGameViewUseCase {
  constructor(private readonly balanceGameRepository: BalanceGameRepository) {}

  execute(contentId: number): Promise<number> {
    return this.balanceGameRepository.recordView(contentId);
  }
}
