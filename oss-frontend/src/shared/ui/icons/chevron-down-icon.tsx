import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 아래 방향 셰브런 아이콘(드롭다운 표시) — 디자인 SVG(chevron-down.svg).
 *
 * 원본 stroke #292A2E → currentColor로 바꿔 부모의 색을 상속한다.
 * viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function ChevronDownIcon({
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
