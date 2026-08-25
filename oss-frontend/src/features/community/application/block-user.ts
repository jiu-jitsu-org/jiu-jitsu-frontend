import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 유저(댓글·게시글 작성자)를 차단한다.
 *
 * 차단은 댓글 1건이 아니라 회원 단위 동작이다 — 차단하면 그 회원의 게시글은 목록·상세에서
 * 비노출되고, 댓글·대댓글은 placeholder로 바뀐다. 적용 범위는 요청한 사용자 계정뿐이다.
 *
 * 서버 단일 엔드포인트(POST /user/block/{id})가 현재 상태를 뒤집고 결과를 돌려주므로,
 * 토글 후의 차단 여부(true=차단)를 그대로 반환한다. 해제(설정 > 차단 회원 관리)도 같은 호출이다.
 */
export class BlockUserUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(userId: number): Promise<boolean> {
    return this.writeRepository.toggleBlock(userId);
  }
}
