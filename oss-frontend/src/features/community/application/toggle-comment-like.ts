import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 댓글 좋아요를 토글한다(등록/취소).
 *
 * 게시글 좋아요(POST/DELETE 분리)와 달리 업스트림이 단일 엔드포인트 토글이라,
 * 현재 상태를 받지 않고 호출만 위임한 뒤 토글 후의 좋아요 상태를 반환한다.
 */
export class ToggleCommentLikeUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(commentId: number): Promise<boolean> {
    return this.writeRepository.toggleCommentLike(commentId);
  }
}
