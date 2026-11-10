import { DEFAULT_ICON_SIZE, type IconProps } from "./types";

/**
 * 좋아요(하트) 아이콘 — 모서리를 둥글게 굴린 한 줄 하트(#392).
 *
 * 색은 currentColor라 부모의 색 토큰(reaction-bar-* )을 따른다. `filled`(켜짐)면 선이 조금 굵어지고
 * 안쪽이 같은 색 20%로 연하게 채워진다.
 * 패스는 위 오목한 곳에서 출발해 시계 방향으로 한 바퀴 돈다 — 켜질 때 띠가 감기는 움직임
 * (REACTION_WRAP_MOTION)이 이 순서대로 그려지고, `pathLength=1`이 그 움직임의 기준 길이다.
 */
export function HeartIcon({
  filled = false,
  size = DEFAULT_ICON_SIZE,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        data-wrap-line
        pathLength={1}
        d="M12 7.2C12.9 5.5 14.4 4.5 16 4.5C18.6 4.5 20.5 6.6 20.5 9.3C20.5 13.2 17.2 16.6 13.44 19.71Q12 20.77 10.56 19.71C6.8 16.6 3.5 13.2 3.5 9.3C3.5 6.6 5.4 4.5 8 4.5C9.6 4.5 11.1 5.5 12 7.2Z"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.2 : undefined}
        stroke="currentColor"
        strokeWidth={filled ? 2.4 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
