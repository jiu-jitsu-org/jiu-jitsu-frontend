import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 안내(i) 아이콘 — 글쓰기 화면 아래 "커뮤니티 제한 사항" 안내처럼 조용한 안내문 앞에 작게 둔다(#397).
 * 경고(alert-triangle)보다 한 단계 부드러운 어휘라 "주의"가 아니라 "참고"로 읽힌다.
 */
export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 11V16.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={12} cy={7.75} r={1.25} fill="currentColor" />
    </IconBase>
  );
}
