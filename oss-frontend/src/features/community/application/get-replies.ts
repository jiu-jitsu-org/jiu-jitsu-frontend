import type { ReplyPage } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 부모 댓글의 대댓글을 페이지 단위로 조회한다(「대댓글 더보기」).
 *
 * 게시글 상세 응답에는 대댓글이 상위 3개만 딸려 오므로(backend#111), 4번째부터는 이 경로로 받는다.
 * 미리보기 3개를 건너뛰는 오프셋은 서버가 처리하니 page만 0부터 올려 넘긴다.
 */
export class GetRepliesUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(
    parentCommentId: number,
    sort: CommentSort,
    page: number,
  ): Promise<ReplyPage> {
    return this.postRepository.getReplies(parentCommentId, sort, page);
  }
}
