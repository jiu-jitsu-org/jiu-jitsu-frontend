import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 게시글 숨김을 토글한다.
 *
 * 서버 단일 엔드포인트(PUT /board/hide/{id})가 현재 상태를 뒤집고 결과를 돌려주므로,
 * 토글 후의 숨김 여부(true=숨김)를 그대로 반환한다. 되돌리기(숨김 해제)도 같은 호출이다.
 */
export class ToggleHideUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(postId: number): Promise<boolean> {
    return this.writeRepository.toggleHide(postId);
  }
}
