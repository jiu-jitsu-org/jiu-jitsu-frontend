import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 좋아요를 토글한다.
 *
 * 현재 좋아요 상태(liked)를 받아 반대 동작(취소/추가)을 수행한다. 멱등 토글이라
 * 별도 응답 본문은 다루지 않는다(낙관적 UI는 presentation이 카운트를 보정).
 */
export class ToggleLikeUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number, liked: boolean): Promise<void> {
    if (liked) {
      await this.writeRepository.unlikePost(postId);
      return;
    }

    await this.writeRepository.likePost(postId);
  }
}
