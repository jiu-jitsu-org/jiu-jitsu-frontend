import { type IconProps } from "./types";

/**
 * 닫기(×) 아이콘 — 디자인 SVG.
 *
 * 원본 stroke #70737C → currentColor로 바꿔 부모의 색 토큰을 상속한다(다른 아이콘과 동일 규칙).
 * viewBox 24 기준이라 size 기본값도 24다.
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
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
