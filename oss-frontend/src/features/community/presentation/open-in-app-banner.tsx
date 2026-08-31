"use client";

import { useSyncExternalStore } from "react";

import {
  APP_STORE_URL,
  buildOpenInAppUrl,
  scheduleAppStoreFallback,
} from "@/shared/lib/app-link";

// 현재 주소는 클라이언트 전용(window) 외부 상태다.
// useSyncExternalStore로 읽어 SSR 하이드레이션 불일치와 effect 내 setState를 피한다.
const subscribeNoop = () => () => {};

const getCurrentUrl = () => window.location.href;

const getServerSnapshot = () => null;

/**
 * 외부 브라우저 전용 '앱 열기' 유도 배너 — 앱 웹뷰용 앱바를 대신해 최상단에 선다(#72).
 *
 * WHY AppBarShell을 쓰지 않는가: 셸은 높이 44(h-11) 고정이 계약인데 이 배너는 문구+버튼이라
 * 더 높다. safe-area를 흰 배경으로 덮는 처리만 같은 방식으로 맞춘다.
 *
 * FIXME(디자인): 디자인 가이드 출시 전까지의 임시 시안이다. 문구·레이아웃은 확정 후 교체한다.
 */
export function OpenInAppBanner() {
  const currentUrl = useSyncExternalStore(
    subscribeNoop,
    getCurrentUrl,
    getServerSnapshot,
  );

  return (
    <div className="box-content bg-[var(--bw-true-white)] pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
        <p className="text-body-s min-w-0 flex-1 truncate text-text-primary">
          앱에서 더 편하게 볼 수 있어요
        </p>

        {/*
          반드시 <a href>여야 한다 — iOS는 사용자의 실제 링크 탭에만 반응하고
          onClick + router.push 같은 스크립트 내비게이션에는 반응하지 않는다(#72 실측).
          onClick은 이동을 대신하는 게 아니라 미설치 폴백 타이머만 건다.

          주소를 아직 못 읽었으면 App Store로 보낸다 — 탭이 빨라도 최소한 설치 경로로는 이어진다.
        */}
        <a
          href={currentUrl ? buildOpenInAppUrl(currentUrl) : APP_STORE_URL}
          onClick={() => scheduleAppStoreFallback()}
          className="text-button-s inline-flex h-8 shrink-0 items-center justify-center rounded-[10px] bg-button-filled-default-bg px-3 text-button-filled-default-text"
        >
          앱으로 보기
        </a>
      </div>
    </div>
  );
}
