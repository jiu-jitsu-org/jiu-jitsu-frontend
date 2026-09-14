"use client";

import { useSyncExternalStore } from "react";

import { APP_STORE_URL, buildOpenInAppUrl } from "@/shared/lib/app-link";

// 현재 주소는 클라이언트 전용(window) 외부 상태다.
// useSyncExternalStore로 읽어 SSR 하이드레이션 불일치와 effect 내 setState를 피한다.
const subscribeNoop = () => () => {};

const getCurrentUrl = () => window.location.href;

const getServerSnapshot = () => null;

/**
 * "지금 보고 있는 페이지를 앱에서 열기" 링크의 href.
 *
 * 반드시 `<a href>`에 꽂아야 한다 — iOS는 사용자의 실제 링크 탭에만 반응하고
 * onClick + router.push 같은 스크립트 내비게이션에는 반응하지 않는다(#72 실측).
 * 탭 시 미설치 폴백(scheduleAppStoreFallback)은 호출부가 onClick으로 건다.
 *
 * 주소를 아직 못 읽었으면(서버 스냅샷) App Store로 보낸다 — 탭이 빨라도 최소한 설치 경로로는 이어진다.
 *
 * 상단 배너와 "앱에서 계속하기" 다이얼로그가 함께 쓴다.
 */
export function useOpenInAppHref(): string {
  const currentUrl = useSyncExternalStore(
    subscribeNoop,
    getCurrentUrl,
    getServerSnapshot,
  );

  return currentUrl ? buildOpenInAppUrl(currentUrl) : APP_STORE_URL;
}
