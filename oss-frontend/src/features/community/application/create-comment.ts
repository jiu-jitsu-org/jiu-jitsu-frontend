import type { Comment } from "@/features/community/domain/comment";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글에 댓글을 작성한다.
 *
 * 빈 본문 방어는 진입부(BFF route)에서 1차로 하되, 여기서도 trim 후 빈 값을 막아
 * use case 단독 재사용 시에도 빈 댓글이 생성되지 않게 한다.
 */
export class CreateCommentUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number, body: string): Promise<Comment> {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error("댓글 내용이 비어 있습니다.");
    }

    return this.writeRepository.createComment(postId, trimmed);
  }
}
