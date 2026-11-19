import type { UpdatePostInput } from "@/features/community/domain/post";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글을 수정한다.
 *
 * 생성(CreatePostUseCase)과 같은 방어를 둔다 — 업스트림은 빈 title을 "변경 없음"으로 조용히
 * 넘기므로(isBlank 무시) 여기서 막지 않으면 사용자가 지운 제목이 그대로 남는 사고가 난다.
 * 본문은 선택이다(#589) — ""를 보내면 서버가 내용을 지운다(backend#264, 전에는 무시했다).
 * 본인 게시글 여부는 업스트림 권한 검사가 담당한다.
 */
export class UpdatePostUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number, input: UpdatePostInput): Promise<void> {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title) {
      throw new Error("제목을 입력해 주세요.");
    }
    if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
      throw new Error("유효한 카테고리가 필요합니다.");
    }

    await this.writeRepository.updatePost(postId, {
      categoryId: input.categoryId,
      title,
      body,
      imageFileIdList: input.imageFileIdList,
      tags: input.tags,
      // 생략된 값(대회 화면이 꺼진 배포)은 요청에 싣지 않는다.
      ...(input.competitionId !== undefined
        ? { competitionId: input.competitionId }
        : {}),
    });
  }
}
