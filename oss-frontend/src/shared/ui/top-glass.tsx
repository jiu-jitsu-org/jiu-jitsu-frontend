import type { CSSProperties, Ref } from "react";

/**
 * 붙는 줄이 붙는 자리(px) — 앱 머리줄 뒤까지 깔린 웹이면 머리줄 높이, 아니면 0(globals.css `--top-glass-offset`).
 * 줄이 붙었는지 · 줄 밑으로 들어갔는지를 화면 위 끝 대신 이 자리와 견준다.
 */
export function readTopGlassOffset(): number {
  return (
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--top-glass-offset",
      ),
    ) || 0
  );
}

/**
 * 붙는 줄(홈 칩 줄 · 대회 필터 줄) 뒤의 유리 면 — 뒤로 지나가는 글이 흐리게 비친다(jiu-jitsu-ios 상단 블러).
 * 앱 머리줄 높이(`--top-glass-offset`)만큼 위로 늘여 머리줄 뒤까지 한 장으로 덮고,
 * 아래 끝은 선 없이 서서히 지운다(globals.css `.top-glass`). 줄 안에 `absolute`로 두고, 앱이 유리 면을 알 때만 그린다.
 *
 * - below: 줄 아래로 더 내려와 지우는 길이(px). 지나가는 글이 줄 끝에서 갑자기 끊기지 않게 한다.
 *   스크롤에 따라 바꾸는 화면(대회 필터 줄)은 ref로 직접 고친다.
 */
export function TopGlass({
  ref,
  below = 0,
  className,
  style,
}: {
  ref?: Ref<HTMLDivElement>;
  below?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={className ? `top-glass ${className}` : "top-glass"}
      style={{ bottom: -below, ...style }}
    />
  );
}
