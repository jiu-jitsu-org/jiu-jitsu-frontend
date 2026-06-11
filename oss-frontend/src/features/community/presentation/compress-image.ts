/**
 * 업로드 전 클라이언트 이미지 압축 (브라우저 전용).
 *
 * 앱 서비스라 원본(수 MB) 그대로 CDN에 올리지 않고, 긴 변을 MAX_EDGE 이내로 줄이고
 * JPEG로 재인코딩해 용량을 크게 낮춘다(보통 10~20배 절감). 폰 사진의 EXIF 방향을
 * 보정해 가로/세로가 틀어지지 않게 한다.
 *
 * 안전 폴백: 비이미지이거나 디코드/인코드에 실패하면(일부 환경의 HEIC 등) 원본을 그대로 반환한다.
 * 결과가 원본보다 크면(이미 작은 이미지) 역시 원본을 유지한다.
 */

/** 긴 변 최대 px. 피드/상세에서 충분히 선명한 균형값. */
const MAX_EDGE = 1600;
/** JPEG 품질(0~1). */
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    // EXIF 방향 보정 — 폰 사진의 회전 메타가 캔버스 픽셀에 반영되게 한다.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_EDGE / longest);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    // 확장자를 .jpg로 정규화(재인코딩이 JPEG이므로).
    const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
