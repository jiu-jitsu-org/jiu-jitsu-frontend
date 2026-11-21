"use client";

import { useEffect, useSyncExternalStore } from "react";

import { OutboundMessageType, type TopGlassPayload } from "./messages";
import { postToNative, supportsNativeMessage } from "./native-bridge";

/** 유리 면을 그리는 동안 루트에 붙는 표시 — 줄 바탕을 비워 유리 면이 비치게 하는 스타일이 본다. */
const TOP_GLASS_FLAG = "topGlass";

function send(active: boolean): void {
  postToNative({
    type: OutboundMessageType.SET_TOP_GLASS,
    payload: { active } satisfies TopGlassPayload,
  });
}

/**
 * 앱 머리줄 뒤까지 유리 면을 그릴지(홈 · 대회 탭, jiu-jitsu-ios 상단 블러).
 *
 * 앱이 알면(지원 목록에 SET_TOP_GLASS) 웹뷰가 머리줄 뒤까지 깔려 있다. 웹은 맨 위를 머리줄 높이만큼 비우고 붙는 줄을
 * 그 아래에 붙이며(globals.css `--top-glass-offset`), 줄의 유리 면을 그만큼 위로 늘여 머리줄과 한 장의 유리로 잇는다.
 * 그리는 동안 앱에 알려 머리줄 바탕을 비우게 하고, 화면을 떠나면 돌려놓는다 — 앱은 알림이 없으면 웹뷰를 머리줄 아래로 되돌린다.
 * 모르는 앱 · 브라우저에서는 false.
 * 서버 그림과 첫 그림은 false다(앱 여부는 브라우저에서만 안다).
 */
export function useNativeTopGlass(): boolean {
  const active = useSyncExternalStore(
    subscribeNothing,
    supportsTopGlass,
    () => false,
  );
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    html.dataset[TOP_GLASS_FLAG] = "";
    send(true);
    return () => {
      delete html.dataset[TOP_GLASS_FLAG];
      send(false);
    };
  }, [active]);
  return active;
}

// 앱이 알리는 지원 목록은 문서 시작 때 정해져 바뀌지 않는다.
function subscribeNothing(): () => void {
  return () => {};
}

function supportsTopGlass(): boolean {
  return supportsNativeMessage(OutboundMessageType.SET_TOP_GLASS);
}
