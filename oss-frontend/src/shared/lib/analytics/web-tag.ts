import { parseAppClient } from "@/shared/lib/app-client/app-client";
import { detectPlatform } from "@/shared/lib/native-bridge";

import { markWebTagState } from "./track";

/**
 * 앱 밖 브라우저의 GA 웹 태그(gtag.js, #579).
 *
 * - 브릿지가 없고 User-Agent가 브라우저로 확실할 때만 띄운다(앱 웹뷰 · 앱 안 약관 웹뷰 제외) —
 *   앱 기록은 앱이 대신한다(#575). 판단은 클라이언트에서만 한다(서버 첫 렌더와 무관).
 * - 측정 ID는 서버 env를 `/api/analytics/config`로 받는다. 없거나 못 받으면 태그 없이 기록을 버린다.
 * - 자동 페이지 조회는 끄고(`send_page_view:false`) 화면 기록은 screen_view로 직접 보낸다. 페이지 제목에 글 제목이
 *   실리지 않게 `page_title`을 "OSS"로 두고 화면이 바뀔 때 화면 이름으로 바꾼다(track).
 */

const CONFIG_PATH = "/api/analytics/config";
const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";
const DEFAULT_PAGE_TITLE = "OSS";

let started = false;

/**
 * 브라우저라고 확신할 때만(User-Agent가 인앱 브라우저 · `Safari/` · `Firefox/`) — 앱 안의 브릿지 없는 웹뷰
 * (iOS 약관 웹뷰는 `OSSApp/`, 안드로이드 약관 웹뷰 · `OSSApp/` 전 iOS 앱은 '모름')는 띄우지 않는다.
 */
function isOutsideApp(): boolean {
  if (detectPlatform() !== "web") return false;
  return parseAppClient(navigator.userAgent).surface === "browser";
}

export function initWebTag(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isOutsideApp()) {
    markWebTagState("none");
    return;
  }
  void loadConfig().then((measurementId) => {
    if (!measurementId) {
      markWebTagState("none");
      return;
    }
    installGtag(measurementId);
    markWebTagState("ready");
  });
}

async function loadConfig(): Promise<string | null> {
  try {
    const response = await fetch(CONFIG_PATH, { credentials: "omit" });
    if (!response.ok) return null;
    const body = (await response.json()) as { measurementId?: unknown };
    return typeof body.measurementId === "string" ? body.measurementId : null;
  } catch {
    return null;
  }
}

function installGtag(measurementId: string): void {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  // gtag.js가 받는 모양 그대로(arguments 객체를 넣는다).
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // page_title은 config가 아니라 set으로 둔다 — config 값은 set보다 우선해, config에 두면 화면마다 바꿀 수 없다.
  window.gtag("set", { page_title: DEFAULT_PAGE_TITLE });
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}
