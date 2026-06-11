import type {
  CreatePostInput,
  CreatedPost,
} from "@/features/community/domain/post";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글을 생성한다(④).
 *
 * 빈 제목/본문 방어는 진입부(BFF route)에서 1차로 하되, use case 단독 재사용에 대비해
 * 여기서도 trim 후 빈 값과 잘못된 categoryId를 막는다. imageFileIdList는 비어 있어도 된다(이미지 없는 글).
 */
export class CreatePostUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(input: CreatePostInput): Promise<CreatedPost> {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title || !body) {
      throw new Error("제목과 내용을 모두 입력해 주세요.");
    }
    if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
      throw new Error("유효한 카테고리가 필요합니다.");
    }

    return this.writeRepository.createPost({
      categoryId: input.categoryId,
      title,
      body,
      imageFileIdList: input.imageFileIdList,
    });
  }
}
