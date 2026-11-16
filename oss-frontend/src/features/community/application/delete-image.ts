import type { CommunityWriteRepository } from "@/features/community/domain/post-repository";

/**
 * 글에 붙지 않고 버려진 내 TEMP 이미지를 지운다(#146).
 *
 * 작성 화면에서 ✕ · 크롭 교체 · 작성 취소로 버린 업로드를 바로 지워 서버 정리 배치(backend#144)의 부담과
 * CDN에 남는 시간을 줄인다. 실패해도 배치가 수거하므로 호출부는 결과를 기다리지 않는다.
 */
export class DeleteImageUseCase {
  constructor(private readonly writeRepository: CommunityWriteRepository) {}

  async execute(imageId: number): Promise<void> {
    await this.writeRepository.deleteImage(imageId);
  }
}
