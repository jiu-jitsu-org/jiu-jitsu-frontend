import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 세로 더보기(점 3개) 아이콘 — 디자인 SVG(eclips-vertical, 24x24).
 *
 * 원본 fill black + stroke #292A2E(1.5) → currentColor로 바꿔 부모의 색 토큰을 상속한다.
 * (가로 점 3개인 MoreIcon과 별개 — 피드카드는 가로, 상세 앱바는 세로)
 */
export function MoreVerticalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      {[5, 12, 19].map((cy) => (
        <circle
          key={cy}
          cx={12}
          cy={cy}
          r={1}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </IconBase>
  );
}
