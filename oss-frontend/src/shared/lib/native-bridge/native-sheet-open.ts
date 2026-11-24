"use client";

import { useEffect } from "react";

import { OutboundMessageType, type SheetOpenPayload } from "./messages";
import { postToNative, supportsNativeMessage } from "./native-bridge";

/** 지금 화면에 떠 있는 웹 시트 수. 겹쳐 열린 시트가 하나라도 남아 있으면 앱 탭 바를 돌려놓지 않는다. */
let openSheetCount = 0;
/** 딤이 깔려 있는 시트 수. 내려가기 시작한 시트는 빠진다 — 겹쳐 열린 시트가 남아 있으면 앱 머리줄도 어두운 채다. */
let dimmedSheetCount = 0;
/** 앱에 마지막으로 알린 상태. 같은 상태를 두 번 보내지 않는다. */
let sent: SheetOpenPayload = { open: false, dimmed: false };

function sync(): void {
  const open = openSheetCount > 0;
  const next: SheetOpenPayload = { open, dimmed: open && dimmedSheetCount > 0 };
  if (next.open === sent.open && next.dimmed === sent.dimmed) return;
  if (!supportsNativeMessage(OutboundMessageType.SET_SHEET_OPEN)) return;
  sent = next;
  postToNative({ type: OutboundMessageType.SET_SHEET_OPEN, payload: next });
}

let syncQueued = false;

/**
 * 같은 순간의 변화를 모아 한 번만 알린다. 시트가 열린 채 화면이 사라지면 딤·열림 정리가 연달아 돌아
 * '딤만 걷힘'이 잠깐 끼어 나가던 것을, 마지막 상태 하나로 보낸다.
 */
function queueSync(): void {
  if (syncQueued) return;
  syncQueued = true;
  queueMicrotask(() => {
    syncQueued = false;
    sync();
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
 *
 * `dimmed`는 딤이 깔린 동안만 true다 — 닫기 시작할 때 바로 false로 알려야 앱 머리줄의 딤이 웹 딤과 함께 걷힌다.
 * 다 내려간 뒤(`active` false)에 걷으면 앱 쪽만 한 박자 늦게 밝아진다. `dimmed`를 모르는 앱은 `open`만 본다.
 */
export function useNativeSheetOpen(active: boolean, dimmed: boolean): void {
  // 열림·딤은 queueSync로 모아 한 메시지로 나간다.
  useEffect(() => {
    if (!dimmed) return;
    dimmedSheetCount += 1;
    queueSync();
    return () => {
      dimmedSheetCount -= 1;
      queueSync();
    };
  }, [dimmed]);

  useEffect(() => {
    if (!active) return;
    openSheetCount += 1;
    queueSync();
    return () => {
      openSheetCount -= 1;
      queueSync();
    };
  }, [active]);
}
