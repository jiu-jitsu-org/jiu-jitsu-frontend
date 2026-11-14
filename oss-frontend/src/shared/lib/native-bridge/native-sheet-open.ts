"use client";

import { useEffect } from "react";

import { OutboundMessageType, type SheetOpenPayload } from "./messages";
import { postToNative, supportsNativeMessage } from "./native-bridge";

/** 지금 화면에 떠 있는 웹 시트 수. 겹쳐 열린 시트가 하나라도 남아 있으면 앱 탭 바를 돌려놓지 않는다. */
let openSheetCount = 0;

function send(open: boolean): void {
  if (!supportsNativeMessage(OutboundMessageType.SET_SHEET_OPEN)) return;
  postToNative({
    type: OutboundMessageType.SET_SHEET_OPEN,
    payload: { open } satisfies SheetOpenPayload,
  });
}

/**
 * 웹 시트가 떠 있는 동안 앱에 알린다(#465 · jiu-jitsu-ios#314).
 *
 * 앱은 떠 있는 탭 바가 가린 높이를 웹뷰에 알려 두므로(obscuredContentInsets) `fixed bottom-0` 시트가
 * 그 위에서 멈추고, 아래 띠를 WebKit이 시트 가장자리 색으로 채워 파란·회색 면이 생긴다.
 * 열려 있다고 알리면 앱은 탭 바를 숨기고 가린 높이를 0으로 돌려 시트가 화면 맨 아래까지 내려온다.
 *
 * `active`는 시트가 화면에 있는 동안(내려가는 중 포함) true여야 한다 — 내려가는 도중 탭 바가 돌아오면
 * 가린 높이가 다시 생겨 시트가 한 번 튀어 오른다. 이 신호를 모르는 앱·브라우저에서는 보내지 않는다.
 */
export function useNativeSheetOpen(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    openSheetCount += 1;
    if (openSheetCount === 1) send(true);
    return () => {
      openSheetCount -= 1;
      if (openSheetCount === 0) send(false);
    };
  }, [active]);
}
