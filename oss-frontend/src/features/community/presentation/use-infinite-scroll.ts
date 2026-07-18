"use client";

import { useEffect, useRef } from "react";

/**
 * 목록 하단 감지용 무한 스크롤 훅.
 *
 * 반환한 ref를 리스트 끝의 sentinel 요소에 걸면, 그 요소가 뷰포트(rootMargin 선반영)에
 * 들어올 때 onReach를 호출한다. 실제 "다음 페이지 로드" 판단/중복 방지는 호출부가 맡는다.
 *
 * - enabled=false면 관찰을 멈춘다(마지막 페이지·에러 상태에서 끄기 위함).
 * - resetKey가 바뀌면 관찰을 재구성한다. IntersectionObserver는 "교차 상태 변화"에만
 *   콜백하므로, 항목을 이어붙인 뒤에도 sentinel이 여전히 화면 안이면 다시 로드가 필요하다.
 *   항목 수 등을 resetKey로 넘기면 재관찰 시점에 교차 여부를 즉시 재평가한다.
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  onReach,
  enabled = true,
  resetKey,
  rootMargin = "200px",
}: {
  onReach: () => void;
  enabled?: boolean;
  resetKey?: unknown;
  rootMargin?: string;
}) {
  const sentinelRef = useRef<T | null>(null);
  // 최신 onReach를 참조로 유지 — 콜백이 바뀌어도 observer를 재생성하지 않는다.
  // (렌더 중 ref 쓰기는 금지라 effect로 동기화한다.)
  const onReachRef = useRef(onReach);
  useEffect(() => {
    onReachRef.current = onReach;
  });

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReachRef.current();
      },
      { rootMargin },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [enabled, resetKey, rootMargin]);

  return sentinelRef;
}
