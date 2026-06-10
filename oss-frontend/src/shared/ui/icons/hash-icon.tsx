import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 해시(#) 아이콘 — 글쓰기 하단 툴바의 "태그 추가" affordance(24x24).
 *
 * 상세 화면 태그가 `#드릴`처럼 해시로 노출되므로, 작성 진입점에서도 해시로 일관되게 표현한다.
 */
export function HashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 9H20M4 15H20M10 3L8 21M16 3L14 21"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
