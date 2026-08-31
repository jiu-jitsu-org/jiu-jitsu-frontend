"use client";

import { useSyncExternalStore } from "react";

import { isNativeBridgeAvailable } from "./native-bridge";

// 네이티브 브릿지 연결 여부는 클라이언트 전용(window) 외부 상태다.
// useSyncExternalStore로 읽어 SSR 하이드레이션 불일치와 effect 내 setState를 피한다(auth-provider와 동일).
const subscribeNoop = () => () => {};

/**
 * 서버 스냅샷은 "앱 웹뷰" — 앱이 다수 경로라 그쪽을 기본값으로 둔다.
 *
 * 웹뷰가 커스텀 User-Agent를 보내지 않아 서버에서는 판별할 수단이 없다. 그래서 첫 렌더는 앱 기준으로
 * 두고 브라우저에서만 교체한다 — 외부 브라우저 진입 시 앱 UI가 한 프레임 스치는 것은 감수한다.
 * FIXME: 앱이 커스텀 User-Agent를 싣게 되면 서버에서 판별해 이 깜빡임을 없앤다.
 */
const getServerSnapshot = () => false;

const getIsExternalBrowser = () => !isNativeBridgeAvailable();

/**
 * 지금 화면이 앱 웹뷰가 아니라 외부 브라우저인지 (#72).
 *
 * 공유 링크로 들어온 브라우저에는 세션이 없어 로그인 기반 동작이 전부 실패한다. 호출부는 이 값으로
 * 쓰기 UI를 감추거나 비활성 표시로 바꾼다 — "눌리는데 아무 일도 안 일어나는" 상태를 만들지 않기 위함이다.
 */
export function useIsExternalBrowser(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    getIsExternalBrowser,
    getServerSnapshot,
  );
}
