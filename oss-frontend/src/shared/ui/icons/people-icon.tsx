import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 사람들 아이콘 — 대회 상세 '대회 이야기' 제목(같은 대회에 나가는 사람들의 글). 채운 모양만 있다.
 * 아직 디자인 SVG가 없어 그렸다. 받으면 교체한다.
 */
export function PeopleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <g fill="currentColor">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 19.5a6.5 6.5 0 0 1 13 0v.5h-13Z" />
        <circle cx="17.2" cy="9" r="2.8" />
        <path d="M15.8 13.6a5 5 0 0 1 5.7 5.9v.5h-4.2a8 8 0 0 0-1.5-6.4Z" />
      </g>
    </IconBase>
  );
}
