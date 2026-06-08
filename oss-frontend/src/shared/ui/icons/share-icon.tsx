import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 공유 아이콘 — 디자인 SVG(share.svg).
 *
 * 원본 stroke #CECFD1 → currentColor로 바꿔 부모의 색 토큰(reaction-bar-* )을 상속한다.
 * viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다(bookmark/heart/comment와 동일).
 */
export function ShareIcon({
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
        d="M7.99935 1.33301V9.99967M5.33268 3.99967L7.99935 1.33301L10.666 3.99967M2.66602 7.99967V13.333C2.66602 13.6866 2.80649 14.0258 3.05654 14.2758C3.30659 14.5259 3.64573 14.6663 3.99935 14.6663H11.9993C12.353 14.6663 12.6921 14.5259 12.9422 14.2758C13.1922 14.0258 13.3327 13.6866 13.3327 13.333V7.99967"
        stroke="currentColor"
        strokeWidth={0.886667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
