import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 타이머(스톱워치) 아이콘 — 디자인 SVG.
 *
 * 원본 stroke #0091FF → currentColor로 바꿔 부모의 색을 상속한다(밸런스 게임 잔여 시간에서는
 * interactive-primary). viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 *
 * `filled`: 몸통을 칠하고 바늘을 파낸 모양(알림함 밸런스 결과 알림, #683). 다른 알림 아이콘(댓글 · 좋아요)이
 * 채운 모양이라 맞춘다. 바늘은 구멍이라 어떤 바탕 위에서도 바탕색이 비친다.
 */
export function TimerIcon({
  filled = false,
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps & { filled?: boolean }) {
  if (filled) {
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
        <rect x="6" y="0.7" width="4" height="1.8" rx="0.9" fill="currentColor" />
        {/* 몸통 원에서 바늘(둥근 막대)을 evenodd로 뚫는다 — 마스크 id를 쓰지 않아 여러 개를 그려도 서로 엉키지 않는다. */}
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M2.1 9.33333A5.9 5.9 0 1 0 13.9 9.33333A5.9 5.9 0 1 0 2.1 9.33333ZM8.566 9.899L10.666 7.799A0.8 0.8 0 0 0 9.534 6.667L7.434 8.767A0.8 0.8 0 0 0 8.566 9.899Z"
        />
      </svg>
    );
  }

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
