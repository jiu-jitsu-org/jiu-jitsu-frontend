import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 카메라 아이콘 — 글쓰기 사진 선택창의 "촬영하기" 항목(24x24).
 *
 * ImageIcon("앨범에서 선택")과 나란히 놓이므로 같은 선 굵기(2)·둥근 끝으로 맞춘다.
 */
export function CameraIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 8C3 6.89543 3.89543 6 5 6H7.5L9 4H15L16.5 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={12} cy={13} r={3.5} stroke="currentColor" strokeWidth={2} />
    </IconBase>
  );
}
