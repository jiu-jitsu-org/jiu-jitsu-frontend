import { ApiErrorCode } from "@/shared/lib/http/api-error";

import type { AnalyticsContentType } from "./content";
import { track } from "./track";

/**
 * 오류 기록(`error_shown`, #583) — 사용자에게 오류 문구 · 오류 화면이 보일 때 한 번.
 *
 * - 오류 토스트(tone error)는 ToastProvider가 띄울 때마다 남긴다. 부르는 쪽은 아는 만큼 `error`로 싣는다.
 * - 오류 화면(FallbackScreen · FeedErrorState · DetailErrorState)은 화면이 붙을 때 한 번. 다시 시도해도 같은
 *   화면이 남아 있으면 다시 세지 않는다.
 * - 바로 닫히는 상세(지운 글 · 끝난 밸런스 게임)는 닫기 전에 not_found로.
 *
 * 안내 문구 원문은 싣지 않는다 — 종류(error_type)와 서버 코드(error_code)로 남긴다.
 */

/** 사전 `error_type`. webview_load는 앱(iOS)만 쓴다. */
export type ErrorShownType =
  | "network"
  | "timeout"
  | "server"
  | "not_found"
  | "forbidden"
  | "validation"
  | "upload"
  | "unknown";

/** 사전 `field` 중 웹이 쓰는 값 — 입력 검사에 걸린 칸. */
export type ErrorShownField =
  | "category"
  | "title"
  | "title_short"
  | "body"
  | "tag"
  | "photo";

export type ErrorShownDetail = {
  /** 정하지 않으면 status · code로 가르고, 그래도 모르면 오프라인이면 network, 아니면 unknown. */
  type?: ErrorShownType;
  /** 응답 상태(분류용 — 꼬리표로는 싣지 않는다). */
  status?: number;
  /** 서버 오류 코드(`C0015` 등). 웹 자체 시간 초과(504)는 `TIMEOUT`으로 바꿔 싣는다. */
  code?: string;
  field?: ErrorShownField;
  contentType?: AnalyticsContentType;
};

const TIMEOUT_CODE = "TIMEOUT";

/** 응답 상태 · 코드로 사전 `error_type`을 정한다. 가를 수 없으면 undefined. */
function errorTypeOf(
  status: number | undefined,
  code: string | undefined,
): ErrorShownType | undefined {
  if (code === TIMEOUT_CODE) return "timeout";
  if (code === ApiErrorCode.FORBIDDEN_WORD) return "validation";
  if (code === ApiErrorCode.BOARD_NOT_FOUND) return "not_found";
  if (status === undefined) return undefined;
  // 웹 HTTP 클라이언트의 시간 초과는 504 + 코드 없음(서버 오류 코드로 정규화)으로 온다(http-client.ts).
  if (status === 504) return "timeout";
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "forbidden";
  if (status >= 500) return "server";
  // 400 · 422만 요청 검사 거절로 본다 — 그 밖의 4xx(409 등)는 입력 문제로 단정하지 않는다.
  if (status === 400 || status === 422) return "validation";
  return undefined;
}

function isOffline(): boolean {
  try {
    return typeof navigator !== "undefined" && navigator.onLine === false;
  } catch {
    return false;
  }
}

/** 서버 코드만 싣는다. 웹이 붙인 기본값(SY002 · 504)은 시간 초과면 TIMEOUT으로, 아니면 그대로. */
function errorCodeOf(
  type: ErrorShownType,
  code: string | undefined,
): string | undefined {
  if (type === "timeout") return TIMEOUT_CODE;
  return code || undefined;
}

export function trackErrorShown(detail: ErrorShownDetail = {}): void {
  const type =
    detail.type ??
    errorTypeOf(detail.status, detail.code) ??
    // 응답으로 가를 수 없을 때(요청이 서버에 닿지 못함 등) 끊긴 망이면 network.
    (isOffline() ? "network" : undefined) ??
    "unknown";
  track("error_shown", {
    error_type: type,
    error_code: errorCodeOf(type, detail.code),
    field: detail.field,
    content_type: detail.contentType,
  });
}
