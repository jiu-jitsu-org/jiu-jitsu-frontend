import type {
  RegisterImageInput,
  RegisteredImage,
} from "@/features/community/domain/image";
import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * ImageKit 업로드 결과(cdnId/imageUrl)를 서버에 등록한다(③) → TEMP 이미지(int id).
 *
 * cdnId/imageUrl이 비어 있으면 등록 자체가 무의미하므로 use case에서도 1차 방어한다.
 */
export class RegisterImageUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(input: RegisterImageInput): Promise<RegisteredImage> {
    const cdnId = input.cdnId.trim();
    const imageUrl = input.imageUrl.trim();
    if (!cdnId || !imageUrl) {
      throw new Error("등록할 이미지 정보가 비어 있습니다.");
    }

    return this.writeRepository.registerImage({ cdnId, imageUrl });
  }
}
