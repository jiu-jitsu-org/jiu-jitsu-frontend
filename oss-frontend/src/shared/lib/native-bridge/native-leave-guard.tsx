"use client";

import { useEffect, useRef } from "react";

import { InboundMessageType, OutboundMessageType } from "./messages";
import { postToNative, registerWebBridge } from "./native-bridge";

/**
 * 서브웹뷰 스와이프 백 가드(#263) — 지금 닫히면 안 되는 동안 네이티브 스와이프 백을 웹으로 넘겨받는다.
 *
 * 네이티브 계약:
 * - 기본은 네이티브가 스와이프 백으로 서브뷰를 바로 닫는다.
 * - enabled가 true가 되면 SET_LEAVE_GUARD(enabled:true)를 보낸다 → 네이티브는 스와이프를 시작하지 않고
 *   BACK_PRESSED를 보낸다. 훅이 받아 onBack(앱바 뒤로가기와 같은 핸들러)을 실행하고, 닫을 때만 CLOSE_SUBVIEW가 나간다.
 * - enabled가 false가 되거나 언마운트되면 SET_LEAVE_GUARD(enabled:false) → 다시 스와이프로 바로 닫힌다.
 *
 * 메시지를 모르는 구 앱은 그냥 무시한다(글쓰기·수정은 그쪽에서 스와이프가 꺼져 있어 지금과 같다).
 * onBack은 매 렌더 최신값을 ref로 들고 호출하므로, 리스너는 마운트 동안 한 번만 등록된다.
 */
export function useNativeLeaveGuard(enabled: boolean, onBack: () => void): void {
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    postToNative({
      type: OutboundMessageType.SET_LEAVE_GUARD,
      payload: { enabled },
    });
  }, [enabled]);

  useEffect(() => {
    const unregister = registerWebBridge((message) => {
      if (message.type === InboundMessageType.BACK_PRESSED) {
        onBackRef.current();
      }
    });

    return () => {
      unregister();
      postToNative({
        type: OutboundMessageType.SET_LEAVE_GUARD,
        payload: { enabled: false },
      });
    };
  }, []);
}
