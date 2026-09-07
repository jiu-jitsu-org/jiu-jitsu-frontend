import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 컨텐츠의 알림 수신 여부를 조회한다.
 *
 * 게시글 상세는 부르지 않는다 — 상세 응답에 noticeEnabled가 함께 오기 때문이다.
 * 밸런스 게임 응답에는 그 필드가 없어 이 조회로 종 아이콘의 초기 상태를 채운다.
 *
 * 인증이 필요하다. 비로그인은 받을 설정 자체가 없으므로 호출부가 부르지 않는다.
 */
export class GetNoticeEnabledUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(contentId: number): Promise<boolean> {
    return this.writeRepository.getNoticeEnabled(contentId);
  }
}
