import { useId } from "react";

import { IconBase } from "./icon-base";
import type { IconProps } from "./types";

/**
 * 지우기(⊗) — 꽉 찬 원에서 ×를 도려낸 모양. 검색칸의 검색어 지우기가 쓴다.
 *
 * 대회 목록 '접수 마감' 칩의 원 + × 와 같은 비례(원 반지름 10 · × 선 2.4)라 한 화면에서 같은 식구로 보인다.
 * ×는 원을 도려내 놓인 바탕이 비치므로 흰색을 따로 정하지 않는다. 색은 부모 글자색을 따른다.
 */
export function ClearIcon(props: IconProps) {
  const maskId = useId();
  return (
    <IconBase {...props}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <path
          d="M9 9l6 6m0-6l-6 6"
          stroke="black"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </mask>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </IconBase>
  );
}
