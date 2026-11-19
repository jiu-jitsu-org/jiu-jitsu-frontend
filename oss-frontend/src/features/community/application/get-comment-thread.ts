import type { CommentThread } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 알림에서 연 댓글 하나를 조회한다(#596, backend#271) — 대댓글이면 원 댓글과 함께.
 *
 * 상세 SSR이 주소의 `commentId`로 부르고, 결과를 댓글 목록 맨 위에 먼저 보여 준다.
 * sort는 원 댓글에 딸린 대댓글 미리보기 정렬이라 목록과 같은 값을 넘긴다.
 */
export class GetCommentThreadUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(commentId: number, sort: CommentSort): Promise<CommentThread> {
    return this.postRepository.getCommentThread(commentId, sort);
  }
}
