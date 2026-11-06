import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 목록 아이콘 — 대회 탭 달력 ↔ 목록 전환(#339).
 * 아직 디자인 SVG가 없어 다른 아이콘과 같은 선 굵기(2)·둥근 끝으로 그렸다. 받으면 교체한다.
 */
export function ListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M9 6H20M9 12H20M9 18H20M4.5 6H4.51M4.5 12H4.51M4.5 18H4.51"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
