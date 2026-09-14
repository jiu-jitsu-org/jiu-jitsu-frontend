import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 체크(✓) 아이콘 — 글쓰기 앱바 우측 "등록" 버튼(24x24).
 *
 * 디자인이 텍스트 대신 체크 아이콘 버튼으로 등록을 표현한다. 색상은 부모의 button-filled 토큰을 상속.
 */
export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}
