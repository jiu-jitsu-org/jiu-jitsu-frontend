import type { PostRepository } from "@/features/community/domain/post-repository";
import type {
  MyPostListQuery,
  PostList,
} from "@/features/community/domain/post-summary";

/**
 * 내 커뮤니티 활동 목록(쓴 글 · 저장한 글)을 조회한다.
 *
 * 로그인 전용 목록이라 factory가 authed repository로만 조립한다.
 * viewer(liked/bookmarked/isOwner) 상태는 메인 피드와 같이 infrastructure가 채운다.
 */
export class GetMyPostListUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: MyPostListQuery): Promise<PostList> {
    return this.postRepository.getMyPostList(query);
  }
}
