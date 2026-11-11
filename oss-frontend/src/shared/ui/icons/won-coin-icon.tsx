import { useId } from "react";

import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 원(₩) 동전 아이콘 — 대회 상세 '참가비' 제목. 채운 모양만 있다.
 * 아직 디자인 SVG가 없어 그렸다. 동전을 채우고 ₩ 글자만 뚫는다(마스크) — 바탕색을 몰라도 비친다. 받으면 교체한다.
 */
export function WonCoinIcon(props: IconProps) {
  const maskId = useId();
  return (
    <IconBase {...props}>
      <mask id={maskId}>
        <circle cx="12" cy="12" r="9.5" fill="white" />
        <path
          d="M7.5 9l1.8 6 2.7-6 2.7 6 1.8-6M7 11.5h10"
          stroke="black"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
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
