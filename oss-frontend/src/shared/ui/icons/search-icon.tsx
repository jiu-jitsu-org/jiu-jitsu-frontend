import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 돋보기 아이콘 — 대회 이름 검색(#345).
 * 아직 디자인 SVG가 없어 다른 아이콘과 같은 선 굵기(2)·둥근 끝으로 그렸다. 받으면 교체한다.
 */
export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth={2} />
      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </IconBase>
  );
}
