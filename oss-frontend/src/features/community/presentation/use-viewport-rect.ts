"use client";

import { useEffect, useState } from "react";

export type ViewportRect = { top: number; height: number; keyboardOpen: boolean };

/** 키보드가 떴다고 볼 임계 높이(px). 작은 UI 변화로 인한 오탐을 거른다. */
const KEYBOARD_THRESHOLD = 100;

/**
 * visualViewport가 보고하는 '실제 보이는 영역'(키보드 위 가시 영역)을 추적한다.
 *
 * 키보드가 웹뷰를 overlay하든 네이티브가 프레임을 줄이든 무관하게, visualViewport.height는 항상
 * 현재 눈에 보이는 높이를, offsetTop은 레이아웃 뷰포트 기준 가시 영역 상단 오프셋을 보고한다.
 * dvh(디바운스됨)·fixed inset-0(레이아웃 뷰포트가 안 줄면 키보드 뒤까지 덮음)가 실패하는 환경에서
 * 유일하게 신뢰할 수 있는 가시 영역의 진실값이다. 셸을 이 값에 맞추면 키보드 위로 정확히 떨어진다.
 *
 * SSR/미지원 환경에선 null → 호출부가 100dvh 등으로 폴백한다.
 */
export function useViewportRect(): ViewportRect | null {
  const [rect, setRect] = useState<ViewportRect | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      // overlay 모드(레이아웃 뷰포트는 그대로, 키보드만 덮음)에선 innerHeight−visualViewport.height가
      // 키보드 높이 → 키보드 떠 있음을 잡는다. 프레임 축소 모드에선 둘이 같이 줄어 ~0(이 경우 env가
      // 자동 0이라 패딩 토글이 불필요하므로 false여도 무방).
      const covered =
        window.innerHeight - viewport.height - viewport.offsetTop;
      setRect({
        top: Math.round(viewport.offsetTop),
        height: Math.round(viewport.height),
        keyboardOpen: covered > KEYBOARD_THRESHOLD,
      });
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return rect;
}
