import type { PostRepository } from "@/features/community/domain/post-repository";
import type {
  BoardListQuery,
  PostList,
} from "@/features/community/domain/post-summary";

/**
 * 게시글 목록을 조회한다.
 *
 * viewer(liked/bookmarked/commented) 상태는 infrastructure가 토큰 유무에 따라 채운다.
 * 이 use case는 "목록 가져오기" 흐름만 담당한다(상세의 GetPostDetailUseCase와 동일 철학).
 */
export class GetPostListUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: BoardListQuery): Promise<PostList> {
    return this.postRepository.getPostList(query);
  }
}
