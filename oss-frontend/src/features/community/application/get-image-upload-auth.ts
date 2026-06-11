import type { ImageUploadAuth } from "@/features/community/domain/image";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * ImageKit 업로드용 서명을 발급한다(①).
 *
 * 비즈니스 규칙 없는 통과 use case지만, 발급은 인증된 사용자에게만 의미가 있으므로
 * authed 클라이언트로 구성된 write repository를 통해 호출한다.
 */
export class GetImageUploadAuthUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(): Promise<ImageUploadAuth> {
    return this.writeRepository.getImageUploadAuth();
  }
}
