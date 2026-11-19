"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

/**
 * 망이 끊겨 브라우저 쪽 요청이 실패했을 때의 안내 (#543).
 *
 * 앱 덮개(jiu-jitsu-ios#396)와 같은 문구다. 서버 오류(5xx)나 서버 렌더에서 난 오류는 사용자 망과 상관없어
 * 지금 문구 그대로 두고, 브라우저가 오프라인이라고 알릴 때(navigator.onLine === false)만 이 문구로 바꾼다.
 * 요청이 나가지 못한 실패(fetch TypeError)는 같은 출처 BFF가 꺼진 경우와 구분되지 않아 보지 않는다.
 */
export const CONNECTION_LOST_MESSAGE = "연결이 불안정해요";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** 브라우저가 연결돼 있다고 보는지. 서버 렌더 · 첫 그리기는 연결된 것으로 본다. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/**
 * 끊겼던 연결이 돌아오는 순간 한 번 `retry`를 부른다 — 문구에는 적지 않지만 연결되면 저절로 다시 불러온다.
 * 다시 끊겼다 이어지면 그때 또 한 번이다.
 *
 * 리스너는 붙어 있는 동안 한 벌만 둔다 — 연결 상태(useOnline)에 따라 붙였다 떼면, 'online' 이벤트에서
 * useOnline이 먼저 다시 그려 리스너를 떼어 버려 재시도가 불리지 않는다.
 */
export function useRetryWhenOnline(retry: () => void): void {
  const onBackOnline = useEffectEvent(retry);
  useEffect(() => {
    let lost = !navigator.onLine;
    const handleOffline = () => {
      lost = true;
    };
    const handleOnline = () => {
      if (!lost) return;
      lost = false;
      onBackOnline();
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
