import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 타이머(스톱워치) 아이콘 — 디자인 SVG.
 *
 * 원본 stroke #0091FF → currentColor로 바꿔 부모의 색을 상속한다(밸런스 게임 잔여 시간에서는
 * interactive-primary). viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function TimerIcon({ size = DEFAULT_ICON_SIZE, ...props }: IconProps) {
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
        d="M6.66667 1.33333H9.33333M8 9.33333L10 7.33333M13.3333 9.33333C13.3333 12.2789 10.9455 14.6667 8 14.6667C5.05448 14.6667 2.66667 12.2789 2.66667 9.33333C2.66667 6.38781 5.05448 4 8 4C10.9455 4 13.3333 6.38781 13.3333 9.33333Z"
        stroke="currentColor"
        strokeWidth={1.33}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
