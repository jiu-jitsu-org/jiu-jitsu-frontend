import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 북마크 아이콘 — 디자인 SVG(디폴트 상태).
 *
 * 원본 stroke #CECFD1 → currentColor로 바꿔 부모의 색 토큰(reaction-bar-* )을 상속한다.
 * `filled`(활성)는 아직 전용 SVG가 없어 동일 패스를 채워 임시 처리한다 — 실제 채움 SVG 수령 시 교체.
 * viewBox가 16이라 공통 IconBase(24)를 쓰지 않고 독립 svg로 둔다.
 */
export function BookmarkIcon({
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
        d="M12.6673 14L8.00065 11.3333L3.33398 14V3.33333C3.33398 2.97971 3.47446 2.64057 3.72451 2.39052C3.97456 2.14048 4.3137 2 4.66732 2H11.334C11.6876 2 12.0267 2.14048 12.2768 2.39052C12.5268 2.64057 12.6673 2.97971 12.6673 3.33333V14Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
