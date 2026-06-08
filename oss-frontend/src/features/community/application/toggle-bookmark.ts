import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 북마크를 토글한다.
 *
 * 현재 북마크 상태(bookmarked)를 받아 반대 동작(취소/추가)을 수행한다.
 */
export class ToggleBookmarkUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number, bookmarked: boolean): Promise<void> {
    if (bookmarked) {
      await this.writeRepository.unbookmarkPost(postId);
      return;
    }

    await this.writeRepository.bookmarkPost(postId);
  }
}
