import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 타이머(스톱워치) 아이콘 — 밸런스 게임 잔여 시간 앞에 붙는다.
 *
 * FIXME(디자인 SVG 교체): 다른 아이콘들과 달리 원본 SVG를 받지 못해, 같은 규격
 * (viewBox 16 · stroke currentColor · strokeWidth 1.33333 · round cap/join)에 맞춰
 * 임시로 그린 것이다. 디자인 SVG가 나오면 패스만 갈아끼우면 된다(호출부 변경 불필요).
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
      {/* 다이얼 */}
      <circle
        cx="8"
        cy="9"
        r="5.33333"
        stroke="currentColor"
        strokeWidth={1.33333}
      />
      {/* 바늘 — 12시에서 3시 방향(정지 상태의 스톱워치) */}
      <path
        d="M8 6.33333V9H10"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 용두(위쪽 버튼) */}
      <path
        d="M6.66667 1.33333H9.33333"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
      />
      <path
        d="M8 1.33333V3.66667"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
      />
    </svg>
  );
}
