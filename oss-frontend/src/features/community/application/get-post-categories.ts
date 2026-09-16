import type { PostCategory } from "@/features/community/domain/post";
import type { PostRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 카테고리 목록을 조회한다(GET /board/category).
 *
 * 작성/수정 화면의 칩 목록. 목록·상세와 같은 읽기 repository를 쓴다.
 */
export class GetPostCategoriesUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(): Promise<PostCategory[]> {
    return this.postRepository.getCategories();
  }
}
