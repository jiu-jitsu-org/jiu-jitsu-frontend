import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/** 더보기(가로 점 3개) 아이콘. 색상은 currentColor 상속. */
export function MoreIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </IconBase>
  );
}
