import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 북마크(저장) 아이콘 — 네 귀와 아래 V자를 둥글게 굴린 한 줄 북마크(#392).
 *
 * 그리는 칸은 24 격자에서 가장자리 1.5씩 잘라(21) 예전 16 아이콘과 같은 크기로 보이게 하고, 선 굵기도
 * 예전 비율(1.33/16)에 맞췄다.
 * 색은 currentColor라 부모의 색 토큰(reaction-bar-* )을 따른다. `filled`(켜짐)면 선이 조금 굵어지고
 * 안쪽이 같은 색 20%로 연하게 채워진다.
 * 패스는 위 가운데서 출발해 시계 방향으로 한 바퀴 돈다 — 켜질 때 띠가 감기는 움직임
 * (REACTION_WRAP_MOTION)이 이 순서대로 그려지고, `pathLength=1`이 그 움직임의 기준 길이다.
 */
export function BookmarkIcon({
  filled = false,
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="1.5 1.5 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        data-wrap-line
        pathLength={1}
        d="M12 3.5L15.4 3.5C16.96 3.5 18 4.54 18 6.1L18 19.07C18 19.93 17.54 20.16 16.86 19.64L13.14 16.86C12.46 16.34 11.54 16.34 10.86 16.86L7.14 19.64C6.46 20.16 6 19.93 6 19.07L6 6.1C6 4.54 7.04 3.5 8.6 3.5Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.2 : undefined}
        stroke="currentColor"
        strokeWidth={filled ? 2.1 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
