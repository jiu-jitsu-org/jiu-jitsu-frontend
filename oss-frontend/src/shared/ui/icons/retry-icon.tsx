import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 재시도(↻) 아이콘 — 글쓰기 첨부 썸네일의 업로드 실패 상태(24x24).
 *
 * 실패한 썸네일 위에 흰색(on-overlay)으로 얹혀 "탭하면 다시 올린다"를 알린다. 색상은 부모에서 상속.
 */
export function RetryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
