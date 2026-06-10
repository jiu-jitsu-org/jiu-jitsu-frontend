import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 이미지(사진) 아이콘 — 글쓰기 하단 툴바의 "사진 첨부" affordance(24x24).
 *
 * 상세 화면이 이미지를 비중 있게 보여주므로, 작성 진입점에서도 사진 첨부를 1차 액션으로 노출한다.
 */
export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={2}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={8.5} cy={8.5} r={1.5} stroke="currentColor" strokeWidth={2} />
      <path
        d="M21 15L16 10L5 21"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
