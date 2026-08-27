import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 알림 수신 설정을 토글한다.
 *
 * 서버 단일 엔드포인트(PUT /notice/setting/board/{boardId})가 현재 설정을 뒤집고 결과를
 * 돌려주므로, 토글 후의 수신 여부(true=알림 받음)를 그대로 반환한다.
 */
export class ToggleNoticeUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number): Promise<boolean> {
    return this.writeRepository.toggleNotice(postId);
  }
}
