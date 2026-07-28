import {
  InboundMessageType,
  OutboundMessageType,
  type ConfirmDialogPayload,
  type ConfirmDialogResult,
  type ConfirmDialogResultPayload,
  type InboundMessage,
  type SelectSheetPayload,
  type SelectSheetResultPayload,
} from "./messages";
import {
  isNativeBridgeAvailable,
  postToNative,
  registerWebBridge,
} from "./native-bridge";

/**
 * 네이티브 알럿·선택 시트 코디네이터.
 *
 * WHY: 웹뷰는 자기 프레임 밖(GNB·하단 탭바)을 그릴 수 없어 풀스크린 딤이 필요한 표면은
 * 네이티브가 소유해야 한다. 웹은 "이 문구로 물어봐 달라"고 요청하고 결과만 받아 정책(API 호출)을 잇는다.
 *
 * 기존 브릿지 메시지는 전부 단방향이라 요청↔응답을 짝지을 수단이 없었다. 알럿은 "확인이 눌렸는지"를
 * 받아야 하므로 요청마다 requestId를 발급하고, 응답이 오면 해당 대기자만 깨운다.
 * (세션 갱신 코디네이터 refreshSessionViaBridge와 같은 구조 + 다중 요청 대응)
 */

/**
 * 무응답 대기 상한.
 *
 * 사용자가 알럿을 띄워두고 고민하는 시간을 잘라내면 안 되므로 UX 타임아웃이 아니라
 * "새 메시지를 모르는 구버전 앱에서 대기자가 영원히 남는" 누수를 막는 안전망이다.
 * 그래서 사람이 판단하기에 충분히 긴 값으로 둔다.
 */
const DIALOG_RESULT_TIMEOUT_MS = 5 * 60_000;

type PendingRequest = {
  resolve: (message: InboundMessage) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingRequest>();

let requestSeq = 0;
let unregister: (() => void) | null = null;

/** 요청 식별자. 웹뷰 인스턴스 안에서만 유일하면 되므로 단순 증가값으로 충분하다. */
function nextRequestId(prefix: string): string {
  requestSeq += 1;
  return `${prefix}-${requestSeq}`;
}

/** 인바운드 수신 등록은 첫 요청 때 한 번만(대기자가 없을 땐 굳이 붙잡지 않는다). */
function ensureListener(): void {
  if (unregister) return;

  unregister = registerWebBridge((message) => {
    if (
      message.type !== InboundMessageType.CONFIRM_DIALOG_RESULT &&
      message.type !== InboundMessageType.SELECT_SHEET_RESULT
    ) {
      return;
    }

    const requestId = message.payload?.requestId;
    if (!requestId) return;

    const waiter = pending.get(requestId);
    // 모르는 requestId는 조용히 무시한다 — 중복 회신·타임아웃 이후 뒤늦은 응답 방어.
    if (!waiter) return;

    pending.delete(requestId);
    clearTimeout(waiter.timeoutId);
    waiter.resolve(message);
  });
}

/** 대기자가 모두 정리되면 수신구도 놓아준다(전역 리스너 누수 방지). */
function releaseListenerIfIdle(): void {
  if (pending.size > 0 || !unregister) return;
  unregister();
  unregister = null;
}

/**
 * 요청 1건을 보내고 결과 메시지를 기다린다.
 *
 * 네이티브가 없으면(웹 단독/SSR) 위임 대상이 없으므로 즉시 거절해 호출부가 웹 폴백으로 넘어가게 한다.
 */
function requestFromNative<R>(
  outboundType: string,
  payload: { requestId: string },
  parse: (message: InboundMessage) => R,
  timeoutValue: R,
): Promise<R> {
  if (!isNativeBridgeAvailable()) {
    return Promise.reject(new Error("native bridge unavailable"));
  }

  ensureListener();

  return new Promise<R>((resolve) => {
    const settle = (value: R) => {
      pending.delete(payload.requestId);
      releaseListenerIfIdle();
      resolve(value);
    };

    const timeoutId = setTimeout(
      () => settle(timeoutValue),
      DIALOG_RESULT_TIMEOUT_MS,
    );

    pending.set(payload.requestId, {
      resolve: (message) => settle(parse(message)),
      timeoutId,
    });

    postToNative({ type: outboundType, payload });
  });
}

/**
 * 네이티브 확인 알럿을 띄우고 결과를 기다린다.
 *
 * @throws 네이티브 브릿지가 없으면 거절 — 호출부가 웹 알럿으로 폴백한다.
 */
export function requestNativeConfirm(
  options: Omit<ConfirmDialogPayload, "requestId">,
): Promise<ConfirmDialogResult> {
  const payload: ConfirmDialogPayload = {
    ...options,
    requestId: nextRequestId("confirm"),
  };

  return requestFromNative<ConfirmDialogResult>(
    OutboundMessageType.SHOW_CONFIRM_DIALOG,
    payload,
    (message) =>
      message.type === InboundMessageType.CONFIRM_DIALOG_RESULT
        ? message.payload.result
        : "dismiss",
    // 무응답은 "확인하지 않음"으로 본다 — 파괴적 동작이 사용자 확인 없이 진행되면 안 된다.
    "cancel",
  );
}

/** 선택 시트 결과. 제출이면 사유 코드(+직접 입력)가 함께 온다. */
export type NativeSelectSheetOutcome =
  | { submitted: false }
  | { submitted: true; value?: string; customText?: string };

/**
 * 네이티브 선택 바텀시트를 띄우고 결과를 기다린다.
 *
 * @throws 네이티브 브릿지가 없으면 거절 — 호출부가 웹 시트로 폴백한다.
 */
export function requestNativeSelectSheet(
  options: Omit<SelectSheetPayload, "requestId">,
): Promise<NativeSelectSheetOutcome> {
  const payload: SelectSheetPayload = {
    ...options,
    requestId: nextRequestId("sheet"),
  };

  return requestFromNative<NativeSelectSheetOutcome>(
    OutboundMessageType.SHOW_SELECT_SHEET,
    payload,
    (message) => {
      if (message.type !== InboundMessageType.SELECT_SHEET_RESULT) {
        return { submitted: false };
      }
      const result = message.payload as SelectSheetResultPayload;
      return result.result === "submit"
        ? {
            submitted: true,
            value: result.value,
            customText: result.customText,
          }
        : { submitted: false };
    },
    { submitted: false },
  );
}

/** 결과 payload 타입을 좁혀 쓰기 위한 재노출(호출부 편의). */
export type { ConfirmDialogResultPayload };
