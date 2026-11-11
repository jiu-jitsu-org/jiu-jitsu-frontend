import { useId } from "react";

import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 달력 아이콘 — 대회 탭 목록 ↔ 달력 전환(#339), 대회 상세 '일정' 제목.
 * 아직 디자인 SVG가 없어 다른 아이콘과 같은 선 굵기(2)·둥근 끝으로 그렸다. 받으면 교체한다.
 * `filled`는 같은 윤곽을 채우고 날짜 점만 뚫는다(마스크) — 바탕색을 몰라도 점이 비친다.
 */
export function CalendarIcon({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  const maskId = useId();
  if (filled) {
    return (
      <IconBase {...props}>
        <mask id={maskId}>
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15.5"
            rx="3"
            fill="white"
            stroke="white"
            strokeWidth={2}
          />
          <path
            d="M8 3V6.5M16 3V6.5"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M8 12.75h0M12 12.75h0M16 12.75h0M8 16.75h0M12 16.75h0M16 16.75h0"
            stroke="black"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        </mask>
        <rect
          width="24"
          height="24"
          fill="currentColor"
          mask={`url(#${maskId})`}
        />
      </IconBase>
    );
  }
  return (
    <IconBase {...props}>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="3"
        stroke="currentColor"
        strokeWidth={2}
      />
      <path
        d="M3.5 10H20.5M8 3V6.5M16 3V6.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </IconBase>
  );
}
