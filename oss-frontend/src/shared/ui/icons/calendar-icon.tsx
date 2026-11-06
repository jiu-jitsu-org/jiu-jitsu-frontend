import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 달력 아이콘 — 대회 탭 목록 ↔ 달력 전환(#339).
 * 아직 디자인 SVG가 없어 다른 아이콘과 같은 선 굵기(2)·둥근 끝으로 그렸다. 받으면 교체한다.
 */
export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="3"
        stroke="currentColor"
        strokeWidth={2}
      />
      <path
        d="M3.5 10H20.5M8 3V6.5M16 3V6.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </IconBase>
  );
}
