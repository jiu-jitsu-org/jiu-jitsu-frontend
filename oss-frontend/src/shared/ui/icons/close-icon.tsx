import { type IconProps } from "./types";

/**
 * 닫기(×) 아이콘.
 *
 * FIXME(디자인 미확정): 디자인 SVG를 아직 못 받아 표준 X 형태로 임시 작성했다.
 *   원본 SVG 수령 시 교체(#60). 색은 currentColor로 부모 토큰을 상속한다.
 */
export function CloseIcon({ size = 24, ...props }: IconProps) {
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
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
