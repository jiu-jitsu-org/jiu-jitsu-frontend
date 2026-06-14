import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 댓글을 삭제한다.
 *
 * 본인 댓글 여부는 진입부(BFF route 세션)와 업스트림 권한 검사가 담당하고,
 * 여기서는 대상 댓글 id를 그대로 위임한다.
 */
export class DeleteCommentUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(commentId: number): Promise<void> {
    await this.writeRepository.deleteComment(commentId);
  }
}
