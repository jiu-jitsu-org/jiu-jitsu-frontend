import type { PostDetail } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 상세를 조회한다.
 *
 * viewer(liked/bookmarked/isOwner) 상태는 infrastructure가 토큰 유무에 따라 채운다.
 * 이 use case는 "상세 가져오기" 흐름만 담당한다.
 */
export class GetPostDetailUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(postId: number): Promise<PostDetail> {
    return this.postRepository.getPostDetail(postId);
  }
}
