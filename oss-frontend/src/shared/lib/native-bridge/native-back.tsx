"use client";

import { useEffect, useRef } from "react";

import { InboundMessageType, OutboundMessageType } from "./messages";
import { postToNative, registerWebBridge } from "./native-bridge";

/**
 * 서브웹뷰에서 네이티브 뒤로가기를 가로채는 가드 훅(작성 중 이탈 확인 등).
 *
 * 네이티브 계약:
 * - 기본은 네이티브가 back을 직접 처리(닫기)한다.
 * - 이 훅이 마운트되면 BACK_GUARD(enabled:true)로 "가드 있음"을 통지 → 네이티브는 직접 닫지 않고
 *   BACK_PRESSED를 보낸다. 훅이 받아 handler(예: requestClose)를 실행하고, 닫을 때만 CLOSE_SUBVIEW를 보낸다.
 * - 언마운트 시 BACK_GUARD(enabled:false)로 통지 → 네이티브가 다시 직접 닫기로 돌아간다.
 *
 * 가드가 없는 화면(상세 정상/에러)은 이 훅을 쓰지 않으면 되고, back은 네이티브가 알아서 닫는다.
 * handler는 매 렌더 최신값을 ref로 들고 호출하므로 의존성 때문에 재등록(=BACK_GUARD 재통지)되지 않는다.
 */
export function useNativeBackHandler(handler: () => void): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    postToNative({
      type: OutboundMessageType.BACK_GUARD,
      payload: { enabled: true },
    });

    const unregister = registerWebBridge((message) => {
      if (message.type === InboundMessageType.BACK_PRESSED) {
        handlerRef.current();
      }
    });

    return () => {
      unregister();
      postToNative({
        type: OutboundMessageType.BACK_GUARD,
        payload: { enabled: false },
      });
    };
  }, []);
}
