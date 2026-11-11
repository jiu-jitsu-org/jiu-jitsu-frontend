"use client";

import { useEffect } from "react";

import { OutboundMessageType } from "./messages";
import { isNativeBridgeAvailable, postToNative } from "./native-bridge";

/**
 * 이 페이지가 그려져 손이 닿는 상태가 됐다고 앱에 알린다(PAGE_READY, jiu-jitsu-ios#261).
 *
 * 앱은 이 신호를 받으면 그림·글꼴을 다 받기(load) 전에 로딩 덮개를 걷는다. WEBVIEW_READY는 모든 페이지가
 * 공유하는 껍데기(AuthProvider)가 보내 로딩 뼈대가 떠 있는 동안에도 올 수 있어 기준이 못 된다 — 그때 덮개를
 * 걷으면 웹 헤더의 뒤로가기와 BACK_PRESSED 응답이 아직 없어 화면을 빠져나갈 수 없다.
 * 그래서 이 컴포넌트는 페이지 본문 안에 둔다. 본문이 하이드레이션되는 커밋에서 effect가 돌아,
 * 같은 커밋의 이탈 가드(useNativeLeaveGuard)도 이미 등록된 뒤다.
 *
 * 결과 회신이 없어 지원 목록 확인 없이 보낸다. 모르는 구버전 앱은 무시하고 load 때 덮개를 걷는다.
 */
export function NativePageReady(): null {
  useEffect(() => {
    if (!isNativeBridgeAvailable()) return;
    postToNative({ type: OutboundMessageType.PAGE_READY });
  }, []);
  return null;
}
