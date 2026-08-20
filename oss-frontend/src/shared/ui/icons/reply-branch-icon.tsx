import { type IconProps } from "./types";

/**
 * 대댓글 분기 아이콘 — 디자인 SVG(대댓글.svg).
 *
 * 위에서 내려와 오른쪽으로 꺾이는 연결선으로, 이 행이 "위 댓글의 대댓글"임을 나타낸다.
 * 대댓글 행의 아바타 앞 24 슬롯에 놓여 아바타 상단과 같은 높이에서 시작한다.
 *
 * 원본 stroke #E6E7E8 → currentColor로 바꿔 부모의 색을 상속한다(다른 아이콘과 동일 규칙).
 * viewBox 24 + strokeWidth 2 — 이 아이콘만 24 기준이라 size 기본값도 24다.
 */
export function ReplyBranchIcon({ size = 24, ...props }: IconProps) {
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
        d="M10 0V4C10 8.41828 13.5817 12 18 12H20"
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  );
}
