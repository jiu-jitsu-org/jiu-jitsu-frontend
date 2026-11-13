import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글(밸런스 게임)의 최상위 댓글 목록을 한 페이지씩 조회한다.
 *
 * 정렬·페이지는 입력으로 받아 그대로 위임한다. 첫 페이지는 상세 SSR이, 다음 페이지는
 * 무한 스크롤(BFF GET /api/community/comments)이 부른다. 쿼리스트링 조립은 infrastructure 담당.
 */
export class GetCommentsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(
    postId: number,
    sort: CommentSort,
    page = 0,
  ): Promise<CommentList> {
    return this.postRepository.getComments(postId, sort, page);
  }
}
