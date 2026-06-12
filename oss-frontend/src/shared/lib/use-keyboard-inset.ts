"use client";

import { useEffect, useState } from "react";

/**
 * 키보드가 화면 하단에서 가린 높이(px)를 추적한다.
 *
 * iOS WKWebView는 소프트 키보드를 띄울 때 레이아웃 뷰포트(window.innerHeight)는 그대로 두고
 * visualViewport만 키보드만큼 줄인다. 따라서
 *   가려진 높이 = innerHeight − visualViewport.height − visualViewport.offsetTop
 * 가 키보드가 덮은 영역이 된다. 이 값을 셸 높이에서 빼면 푸터(하단 바)를 키보드 바로 위에 붙일 수 있다.
 *
 * sticky/네이티브 리사이즈에 의존하지 않고 웹이 직접 가시 영역을 계산한다 — 네이티브가 웹뷰를
 * 리사이즈하지 않고 키보드를 덮어쓰는 환경에서도 동작한다. visualViewport 미지원이면 0(=비활성).
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const covered =
        window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
