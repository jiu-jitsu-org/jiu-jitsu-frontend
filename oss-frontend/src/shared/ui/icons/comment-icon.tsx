import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 댓글(말풍선) 아이콘 — 디자인 SVG.
 *
 * `filled`(활성: 내가 댓글을 남긴 상태)는 동일 패스를 채워 표현한다(디자인 fill SVG와 패스 동일).
 * 원본 색(#CECFD1/#70737C) → currentColor로 바꿔 부모의 색 토큰(reaction-bar-* )을 상속한다.
 * viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function CommentIcon({
  filled = false,
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps & { filled?: boolean }) {
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
        d="M1.99511 10.8951C2.09314 11.1424 2.11496 11.4133 2.05778 11.6731L1.34778 13.8664C1.3249 13.9777 1.33082 14.0929 1.36496 14.2012C1.39911 14.3095 1.46035 14.4073 1.54289 14.4853C1.62543 14.5633 1.72652 14.6189 1.83658 14.6469C1.94664 14.6749 2.06202 14.6742 2.17178 14.6451L4.44711 13.9798C4.69226 13.9312 4.94613 13.9524 5.17978 14.0411C6.60337 14.7059 8.21602 14.8466 9.73321 14.4383C11.2504 14.0299 12.5746 13.0989 13.4722 11.8094C14.3699 10.5198 14.7832 8.95472 14.6393 7.39015C14.4954 5.82557 13.8036 4.36209 12.6858 3.25791C11.5681 2.15373 10.0962 1.47981 8.53003 1.35504C6.96382 1.23028 5.40387 1.6627 4.12541 2.57601C2.84694 3.48931 1.93213 4.82481 1.54237 6.34687C1.15262 7.86894 1.31296 9.47975 1.99511 10.8951Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
