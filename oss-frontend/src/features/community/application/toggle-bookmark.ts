import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 저장(북마크)을 토글한다.
 *
 * 서버 단일 엔드포인트(PUT /board/save/{id})가 현재 상태를 뒤집고 결과를 돌려주므로,
 * 토글 후의 저장 여부(isSaved)를 그대로 반환한다.
 */
export class ToggleBookmarkUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number): Promise<boolean> {
    return this.writeRepository.toggleSave(postId);
  }
}
