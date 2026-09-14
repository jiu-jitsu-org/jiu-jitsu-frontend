import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 태그(라벨) 아이콘 — 글쓰기 하단 툴바의 "태그" affordance(24x24).
 *
 * 디자인이 해시(#) 대신 라벨 모양을 쓴다 — 본문 아래 "# 태그" 입력줄과 구분되는 액션 아이콘.
 */
export function TagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={7} cy={7} r={1} fill="currentColor" stroke="currentColor" strokeWidth={1} />
    </IconBase>
  );
}
