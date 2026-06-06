import type { ReactNode } from "react";

import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * SVG 아이콘 공통 래퍼.
 *
 * 개별 아이콘은 이 위에 `<path>` 등 도형만 채운다. 공통 처리:
 * - `size` → 정사각형 width/height
 * - 색상은 `currentColor` 기본 → 부모 `text-*` 토큰에서 상속
 * - 장식용 아이콘 기본값 `aria-hidden`(의미 있는 아이콘은 호출부에서 `aria-label` 등으로 덮어씀)
 */
export function IconBase({
  size = DEFAULT_ICON_SIZE,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}
