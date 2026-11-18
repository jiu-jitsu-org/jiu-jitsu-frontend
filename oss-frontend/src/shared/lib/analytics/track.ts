import { isDevelopmentRuntime } from "@/config/env";
import {
  detectPlatform,
  postNativeAnalyticsEvent,
  whenWebViewReady,
  type AnalyticsEventPayload,
} from "@/shared/lib/native-bridge";

/**
 * 분석 기록(GA) 한 줄 — 화면 코드가 부르는 유일한 입구(#575).
 *
 * - 앱 웹뷰: 앱이 `ANALYTICS_EVENT`를 지원하면 앱에 넘긴다(앱이 GA에 대신 기록, `surface`=webview).
 *   WEBVIEW_READY 전이면 모았다가 보낸 직후에 넘긴다. 지원하지 않는 앱(구버전)이면 버린다.
 * - 앱 밖 브라우저: GA 웹 태그(`window.gtag`, #579 web-tag.ts)로(`surface`=browser). 태그 준비(측정 ID 받기) 전
 *   기록은 모았다가 보내고, 태그가 없기로 정해지면(앱 안 약관 웹뷰 · 측정 ID 없음) 버린다.
 * - 서버 렌더 중에는 아무것도 하지 않는다.
 *
 * 기록 실패가 화면 동작을 막지 않도록 던지지 않는다.
 *
 * 꼬리표에 싣지 않는 것: 닉네임 · 제목 · 본문 · 댓글 · 자유 입력 · 이메일 · 검색어(원문 금지 — 결과 수 구간만),
 * 안내 문구(코드로 바꿔 싣는다). `search_term` 키는 여기서도 뺀다.
 */

/** 꼬리표 값으로 받는 것. 객체 · 배열은 받지 않는다(중첩 금지). */
export type AnalyticsParamValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

const MAX_NAME_LENGTH = 40;
const MAX_VALUE_LENGTH = 100;
/** 앱 · 웹 태그가 `surface`를 하나 더 붙이므로 웹이 보내는 꼬리표는 24개까지(GA 25개 제한). */
const MAX_PARAM_COUNT = 24;
const RESERVED_PREFIXES = ["firebase_", "google_", "ga_"];
const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
/** 웹이 보내지 않는 키. surface는 앱 · 웹 태그가 붙이고, search_term은 검색어 원문 금지 정책. */
const DROPPED_KEYS = new Set(["surface", "search_term"]);
/** 준비 전 모아 두는 최대 개수. 넘으면 오래된 것부터 버린다. */
const MAX_PENDING = 50;

/** 이벤트 이름 · 꼬리표 키가 GA · 앱 사전 검사 규칙에 맞는지. */
export function isValidAnalyticsName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_NAME_LENGTH &&
    NAME_PATTERN.test(name) &&
    !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

/**
 * 꼬리표를 앱 · GA가 받는 모양으로 정리한다.
 * - true/false → "true"/"false", undefined · null → 빠짐
 * - 숫자 → 정수로 반올림(앱은 정수만 받음), NaN · Infinity → 빠짐
 * - 문자열 → 100자까지
 * - 객체 · 배열 · 함수, 규칙에 맞지 않는 키, surface · search_term → 빠짐
 */
export function sanitizeAnalyticsParams(
  params: AnalyticsParams | undefined,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (!params) return result;

  let count = 0;
  for (const [key, value] of Object.entries(params)) {
    if (DROPPED_KEYS.has(key) || !isValidAnalyticsName(key)) {
      warnInDev(`꼬리표 키를 뺌: ${key}`);
      continue;
    }
    let cleaned: string | number | undefined;
    if (typeof value === "string") {
      cleaned = value.slice(0, MAX_VALUE_LENGTH);
    } else if (typeof value === "boolean") {
      cleaned = value ? "true" : "false";
    } else if (typeof value === "number") {
      cleaned = Number.isFinite(value) ? Math.round(value) : undefined;
    } else if (value !== null && value !== undefined) {
      warnInDev(`꼬리표 값이 문자열 · 숫자 · 참거짓이 아니라 뺌: ${key}`);
    }
    if (cleaned === undefined) continue;
    if (count >= MAX_PARAM_COUNT) {
      warnInDev(`꼬리표가 ${MAX_PARAM_COUNT}개를 넘어 뺌: ${key}`);
      continue;
    }
    result[key] = cleaned;
    count += 1;
  }
  return result;
}

const pending: AnalyticsEventPayload[] = [];
let flushScheduled = false;

function flushPending(): void {
  const events = pending.splice(0);
  for (const event of events) {
    postNativeAnalyticsEvent(event);
  }
}

function sendToApp(event: AnalyticsEventPayload): void {
  pending.push(event);
  if (pending.length > MAX_PENDING) pending.shift();
  if (flushScheduled) return;
  flushScheduled = true;
  whenWebViewReady(() => {
    flushScheduled = false;
    flushPending();
  });
}

/** 웹 태그 상태. pending = 아직 모름(initWebTag가 설정을 받는 중). */
type WebTagState = "pending" | "ready" | "none";
let webTagState: WebTagState = "pending";
/** 웹 태그로 보낼 기록 — 주소는 기록한 순간의 것(태그가 늦게 떠도 공유 utm 등이 그 화면 주소로 남게). */
type WebTagEvent = AnalyticsEventPayload & { pageLocation: string };
const pendingWebTag: WebTagEvent[] = [];

/** web-tag.ts가 태그 준비 결과를 알린다. ready면 모아 둔 기록을 보내고, none이면 버린다. */
export function markWebTagState(state: "ready" | "none"): void {
  webTagState = state;
  const events = pendingWebTag.splice(0);
  if (state === "ready") events.forEach(postToWebTag);
}

function sendToWebTag(
  payload: AnalyticsEventPayload,
  pageLocation: string = window.location.href,
): void {
  if (webTagState === "none") return;
  const event: WebTagEvent = { ...payload, pageLocation };
  if (webTagState === "pending") {
    pendingWebTag.push(event);
    if (pendingWebTag.length > MAX_PENDING) pendingWebTag.shift();
    return;
  }
  postToWebTag(event);
}

function postToWebTag(event: WebTagEvent): void {
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  // 화면이 바뀌면 이후 기록의 페이지 제목을 화면 이름으로(문서 제목 = 글 제목이 GA로 가지 않게).
  // set(전역)으로 두고, 이 기록에는 page_location과 함께 이벤트 값으로도 싣는다(이벤트 값이 가장 우선).
  const screenName =
    event.name === "screen_view" && typeof event.params.screen_name === "string"
      ? event.params.screen_name
      : undefined;
  if (screenName) gtag("set", { page_title: screenName });
  gtag("event", event.name, {
    ...event.params,
    surface: "browser",
    page_location: event.pageLocation,
    ...(screenName ? { page_title: screenName } : {}),
  });
}

/**
 * options.pageLocation: 브라우저 웹 태그의 page_location(기본은 지금 주소). 늦게 보내는 화면 기록이
 * 이동 중인 주소가 아니라 그 화면 주소로 남게 screen-view가 넘긴다. 앱 경로에는 쓰지 않는다.
 */
export function track(
  name: string,
  params?: AnalyticsParams,
  options: { pageLocation?: string } = {},
): void {
  if (typeof window === "undefined") return;
  try {
    if (!isValidAnalyticsName(name)) {
      warnInDev(`이벤트 이름이 규칙에 맞지 않아 버림: ${name}`);
      return;
    }
    const event: AnalyticsEventPayload = {
      name,
      params: sanitizeAnalyticsParams(params),
    };
    if (detectPlatform() === "web") {
      sendToWebTag(event, options.pageLocation);
    } else {
      sendToApp(event);
    }
  } catch (error) {
    warnInDev(`기록 실패: ${String(error)}`);
  }
}

function warnInDev(message: string): void {
  if (isDevelopmentRuntime()) {
    console.warn(`[analytics] ${message}`);
  }
}
