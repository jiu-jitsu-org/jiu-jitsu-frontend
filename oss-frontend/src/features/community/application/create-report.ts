import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";
import type { CreateReportInput } from "@/features/community/domain/report";

/**
 * 게시글/댓글을 신고한다.
 *
 * 대상 구분(BOARD/COMMENT)·대상 id·사유를 그대로 위임한다. 동일 대상 중복 신고
 * 차단은 업스트림이 담당하고, 권한 검사는 진입부(BFF route 세션)가 한다.
 */
export class CreateReportUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(input: CreateReportInput): Promise<void> {
    await this.writeRepository.report(input);
  }
}
