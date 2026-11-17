"use client";

import { useSyncExternalStore } from "react";

import { useAppClientHint } from "@/shared/lib/app-client";

import { isNativeBridgeAvailable } from "./native-bridge";

// 네이티브 브릿지 연결 여부는 클라이언트 전용(window) 외부 상태다.
// useSyncExternalStore로 읽어 SSR 하이드레이션 불일치와 effect 내 setState를 피한다(auth-provider와 동일).
const subscribeNoop = () => () => {};

const getIsExternalBrowser = () => !isNativeBridgeAvailable();

/**
 * 지금 화면이 앱 웹뷰가 아니라 외부 브라우저인지 (#72).
 *
 * 공유 링크로 들어온 브라우저에는 세션이 없어 로그인 기반 동작이 전부 실패한다. 호출부는 이 값으로
 * 쓰기 UI를 감추거나 비활성 표시로 바꾼다 — "눌리는데 아무 일도 안 일어나는" 상태를 만들지 않기 위함이다.
 *
 * 첫 렌더(서버 · 하이드레이션): 페이지가 깐 User-Agent 힌트(AppClientHint, #510)가 브라우저라고 확신할 때만
 * 브라우저 화면으로 그린다 — 공유 링크를 연 브라우저에서 앱 화면이 스치지 않게. 앱 · 모름(값을 싣기 전의 앱,
 * 안드로이드 웹뷰) · 힌트를 깔지 않은 화면은 앱이 다수 경로라 지금처럼 앱 기준이다.
 * 그 뒤에는 브릿지 연결 여부로 확정한다.
 */
export function useIsExternalBrowser(): boolean {
  const hint = useAppClientHint();
  const serverIsExternal = hint?.surface === "browser";
  return useSyncExternalStore(
    subscribeNoop,
    getIsExternalBrowser,
    () => serverIsExternal,
  );
}
