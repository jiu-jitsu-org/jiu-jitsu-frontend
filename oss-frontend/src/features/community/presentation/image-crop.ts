/**
 * 게시글 작성 이미지 크롭 — 순수 계산 + 캔버스 잘라내기 (브라우저 전용).
 *
 * 정책: 자동 크롭은 없다(원본 그대로 저장). 사용자가 썸네일을 탭해 직접 편집할 때만 이 모듈로
 * 프리셋 비율(4:3 / 1:1 / 4:5)의 영역을 잘라 새 File을 만든다. 잘라낸 결과가 원본을 대신해
 * 업로드되므로, 편집 취소는 아무것도 바꾸지 않고 완료만 첨부를 교체한다.
 */

/** 편집 화면 비율 프리셋(정책). 값은 폭 ÷ 높이. 순서 = 화면 노출 순서. */
export const CROP_PRESETS = [
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
] as const;

export type CropPresetId = (typeof CROP_PRESETS)[number]["id"];

/**
 * 최소 크롭 크기 — 짧은 변 300px(정책). 이보다 작게 잘라내면 상세/목록에서 뭉개지므로
 * 편집기가 이 값 아래로는 확대(줌인)를 막는다. 원본 자체가 이보다 작으면 원본 크기가 한계.
 */
export const MIN_CROP_SHORT_SIDE = 300;

/** 잘라낼 영역(원본 픽셀 좌표, EXIF 방향 보정 후 기준). */
export type CropRect = { x: number; y: number; width: number; height: number };

/** 첨부에 저장하는 편집 결과 — 다시 열었을 때 같은 프리셋·영역에서 이어 편집한다. */
export type CropState = { preset: CropPresetId; rect: CropRect };

/** 원본 비율에 가장 가까운 프리셋 — 처음 열었을 때 기본 선택(잘리는 면적이 가장 적은 쪽). */
export function nearestPreset(width: number, height: number): CropPresetId {
  if (width <= 0 || height <= 0) return "1:1";
  const ratio = width / height;
  let best: CropPresetId = CROP_PRESETS[0].id;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const preset of CROP_PRESETS) {
    // 비율 차이는 로그 스케일로 비교해야 가로·세로 방향이 대칭으로 취급된다.
    const distance = Math.abs(Math.log(ratio) - Math.log(preset.ratio));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = preset.id;
    }
  }
  return best;
}

export function presetRatio(id: CropPresetId): number {
  return CROP_PRESETS.find((preset) => preset.id === id)?.ratio ?? 1;
}

/**
 * 원본 픽셀 크기(EXIF 방향 보정 후). 편집기 좌표계와 잘라내기(cropImageFile)가 같은 기준을 쓰도록
 * 둘 다 createImageBitmap(from-image)로 읽는다. 디코드 실패(HEIC 등)는 0×0 — 호출부가 "모름"으로 다룬다.
 */
export async function readImageSize(
  file: File,
): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

/** 크롭 결과 JPEG 품질. 업로드 직전 compressImage가 한 번 더 인코딩하므로 여기선 손실을 최소로 둔다. */
const CROP_OUTPUT_QUALITY = 0.92;

/**
 * 원본에서 rect 영역만 잘라 새 File(JPEG)을 만든다. 크기 축소는 하지 않는다 — 업로드 직전
 * compressImage가 긴 변을 줄이므로 여기서 또 줄이면 두 번 리샘플링된다.
 */
export async function cropImageFile(file: File, rect: CropRect): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context 생성 실패");
    context.drawImage(
      bitmap,
      Math.round(rect.x),
      Math.round(rect.y),
      width,
      height,
      0,
      0,
      width,
      height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CROP_OUTPUT_QUALITY),
    );
    if (!blob) throw new Error("크롭 이미지 인코딩 실패");

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}-crop.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
