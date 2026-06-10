import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글의 댓글 목록을 조회한다.
 *
 * 정렬·커서는 입력으로 받아 그대로 위임한다. 목록 표현/페이지네이션 정책은 presentation이,
 * 실제 쿼리스트링 조립은 infrastructure가 담당한다.
 */
export class GetCommentsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(
    postId: number,
    sort: CommentSort,
    cursor?: string,
  ): Promise<CommentList> {
    return this.postRepository.getComments(postId, sort, cursor);
  }
}
