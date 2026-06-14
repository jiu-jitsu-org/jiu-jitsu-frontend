import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 좋아요를 토글한다.
 *
 * 서버 단일 엔드포인트(PUT /board/like/{id})가 현재 상태를 뒤집고 결과를 돌려주므로,
 * 토글 후의 좋아요 여부(isLiked)를 그대로 반환한다(카운트 보정은 presentation 담당).
 */
export class ToggleLikeUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number): Promise<boolean> {
    return this.writeRepository.toggleLike(postId);
  }
}
