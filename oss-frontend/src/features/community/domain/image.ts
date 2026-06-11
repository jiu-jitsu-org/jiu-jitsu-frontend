/**
 * 이미지 업로드(CDN) 도메인 타입.
 *
 * 업로드 흐름: ① 서버에서 ImageKit 서명 발급 → ② 브라우저가 그 서명으로 ImageKit 직접 업로드 →
 * ③ 업로드 결과(cdnId/url)를 서버에 등록해 우리 서버 int imageId 확보(TEMP 상태) →
 * ④ 게시글/프로필 저장 시 그 imageId가 ACTIVE로 전환.
 * 도메인은 ①③의 서버 계약만 안다(② ImageKit 직접 업로드는 클라이언트 책임).
 */

/** ① GET /image/auth 결과 — ImageKit 업로드 호출용 서명. */
export type ImageUploadAuth = {
  token: string;
  expire: number;
  signature: string;
};

/** ③ POST /image 요청 — ImageKit 업로드 결과를 서버에 등록. */
export type RegisterImageInput = {
  /** ImageKit fileId. */
  cdnId: string;
  /** ImageKit 이미지 URL. */
  imageUrl: string;
};

/** ③ POST /image 응답 — 등록된 이미지(TEMP). `id`가 우리 서버 int imageId. */
export type RegisteredImage = {
  id: number;
  cdnId: string;
  imageUrl: string;
  /** TEMP(등록만 됨) → 게시글/프로필 저장 시 ACTIVE. */
  status: string;
};
