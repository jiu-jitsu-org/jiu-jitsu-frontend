import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 왼쪽 방향 셰브런 아이콘(틴트 뒤로가기 버튼) — 디자인 SVG(20x20).
 *
 * 원본 stroke #0091FF → currentColor로 바꿔 부모의 색 토큰을 상속한다.
 * viewBox가 20이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function ChevronLeftIcon({
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
