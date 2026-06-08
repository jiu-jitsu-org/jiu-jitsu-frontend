import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 뒤로가기(chevron-left) 아이콘 — 디자인 SVG(24x24).
 *
 * 원본 stroke #292A2E → currentColor로 바꿔 부모의 색 토큰을 상속한다.
 */
export function BackArrowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
