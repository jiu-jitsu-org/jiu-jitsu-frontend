import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 삭제한 댓글을 복구한다(되돌리기).
 *
 * 본인 댓글 여부·복구 가능 시간은 진입부(BFF route 세션)와 업스트림이 최종 검사하고,
 * 여기서는 대상 댓글 id를 그대로 위임한다. 만료(C0008)·권한(U0003) 실패는 업스트림이
 * HttpError로 돌려주므로 호출부가 상태코드로 안내 문구를 가른다.
 */
export class RestoreCommentUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(commentId: number): Promise<void> {
    await this.writeRepository.restoreComment(commentId);
  }
}
