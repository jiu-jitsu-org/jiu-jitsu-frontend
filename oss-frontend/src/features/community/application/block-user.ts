import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 유저(댓글·게시글 작성자)를 차단한다.
 *
 * 차단은 댓글 1건이 아니라 회원 단위 동작이다 — 차단하면 그 회원의 게시글은 목록·상세에서
 * 비노출되고, 댓글·대댓글은 placeholder로 바뀐다. 적용 범위는 요청한 사용자 계정뿐이다.
 *
 * 서버 단일 엔드포인트(POST /user/block/{id})는 현재 상태를 뒤집는 토글이라, 이미 차단한 회원이면
 * 해제된다(#488). 호출부(댓글 ⋮ 차단)는 늘 "차단"만 의도하므로, 토글 결과가 해제(false)면 한 번 더
 * 토글해 차단 상태로 돌려놓고 그 결과를 반환한다(true=차단). 서버에 다시 눌러도 풀리지 않는 차단이
 * 생기면(backend#232) 여기만 그 호출로 바꾼다. 두 번째 토글이 실패하면 해제된 채로 남는다 — 호출부는 실패로
 * 안내하고(실제로 차단 상태가 아니다), 다시 누르면 차단된다. 해제(설정 > 차단한 회원)는 해제 전용 호출
 * (UnblockUserUseCase)을 쓴다.
 */
export class BlockUserUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(userId: number): Promise<boolean> {
    const blocked = await this.writeRepository.toggleBlock(userId);
    if (blocked) return true;

    return this.writeRepository.toggleBlock(userId);
  }
}
