import {
  detectPlatform,
  OutboundMessageType,
  supportsNativeMessage,
  whenWebViewReady,
} from "@/shared/lib/native-bridge";

import {
  screenOf,
  toScreenFrom,
  withFrom,
  type Screen,
  type ScreenFrom,
  type ScreenName,
} from "./screens";
import { track } from "./track";

/**
 * 화면 기록(`screen_view`, #576).
 *
 * 웹은 "이 문서의 지금 화면"이 바뀔 때마다 한 번 알린다 — 문서 로드, 같은 웹뷰 안 이동(글 등록 뒤 상세,
 * 내 활동 탭, 다음 밸런스 판), 대회 목록 ↔ 달력. 같은 경로 · 같은 화면 · 같은 section이면 다시 알리지 않는다
 * (`?sort=` 바꾸기, `router.refresh`는 이동이 아니다). 앱 웹뷰에서 같은 화면을 다시 불러온 문서(당겨서 새로고침,
 * 같은 글 푸시, 다시 시도)도 알리지 않는다 — 앱이 이 웹뷰의 화면을 이미 안다. 웹뷰마다 마지막으로 알린 화면을
 * sessionStorage에 두고 비교하므로, 다시 불러와 화면이 바뀐 경우(달력 → 목록)는 알린다.
 *
 * 언제 "본 것"으로 세는가
 * - 앱 웹뷰: 앱(jiu-jitsu-ios#425)이 정한다. 웹뷰마다 마지막 알림을 기억했다가 그 웹뷰가 맨 위에 실제로
 *   보일 때 기록한다(미리 불러온 · 숨은 웹뷰, 탭 전환, 상세 닫힘 뒤 다시 보임, 스와이프 백 취소의 짧은 노출).
 *   앱 탭 전환은 웹에 visibilitychange가 온다는 보장이 없어, 웹이 같이 판단하면 빠지거나 두 번 센다.
 * - 앱 밖 브라우저: 웹이 정한다. 문서가 1초 넘게 이어서 보여야 보낸다(짧은 노출 무시). 숨은 채 열렸으면
 *   보일 때까지 미룬다. 뒤로 가기 · bfcache 복원은 화면 이동으로 다시 센다.
 *
 * from: 주소의 `?from=` → `setNextScreenFrom`으로 정한 값 → 직전 화면 이름.
 * 다른 화면을 열 때는 `entryPath`로 주소를 만든다 — 다른 웹뷰(앱 서브뷰)로 열리면 주소에 싣고,
 * 같은 문서(브라우저 라우터 이동)면 메모리로 넘긴다.
 */

/** 브라우저에서 "본 것"으로 세기까지 이어서 보여야 하는 시간(ms). */
const BROWSER_MIN_VISIBLE_MS = 1000;

type ScreenViewParams = {
  screen_name: ScreenName;
  screen_class: "webview";
  from?: ScreenFrom;
  section?: string;
};

let current: { key: string; name: ScreenName } | null = null;
let nextFrom: ScreenFrom | undefined;

/** 이 문서의 지금 화면 이름. 다음 화면을 열 때 `from` 기본값으로 쓴다. 아직 모르면 undefined. */
export function currentScreenName(): ScreenName | undefined {
  return current?.name;
}

/** 바로 다음 같은 문서 안 이동의 `from`을 정한다(예: 글 등록 뒤 상세 = "post_create"). 한 번 쓰고 지운다. */
export function setNextScreenFrom(from: ScreenFrom): void {
  nextFrom = from;
}

/**
 * 다른 화면을 여는 주소(여는 함수 `useOpen*` · 대회 상세 링크가 쓴다). from을 주지 않으면 지금 화면 이름.
 *
 * - 앱 웹뷰(새 서브뷰로 열림): 앱이 `ANALYTICS_EVENT`를 지원할 때만 주소에 `?from=`을 싣는다. 지원하지 않는
 *   앱(구버전 · 짝 작업 전)은 기록도 하지 않아 from이 쓸모없고, 그 앱은 상세 주소를 쿼리까지 비교해 같은 글
 *   푸시를 알아보므로 주소를 바꾸지 않는다.
 * - 브라우저(같은 문서 안 라우터 이동): 주소에 싣지 않고 다음 화면 기록으로 넘긴다 — 공유 · 뒤로 가기 때
 *   옛 from이 주소에 남지 않게.
 */
export function entryPath(path: string, from?: ScreenFrom): string {
  const resolved = from ?? currentScreenName();
  if (!resolved || typeof window === "undefined") return path;
  if (detectPlatform() === "web") {
    nextFrom = resolved;
    return path;
  }
  return supportsNativeMessage(OutboundMessageType.ANALYTICS_EVENT)
    ? withFrom(path, resolved)
    : path;
}

function fromOfUrl(searchParams: URLSearchParams): ScreenFrom | undefined {
  return toScreenFrom(searchParams.get("from"));
}

/** 이 웹뷰가 앱에 마지막으로 알린 화면(앱만). sessionStorage는 웹뷰마다 따로이고 다시 불러와도 남는다. */
const LAST_ANNOUNCED_KEY = "oss.analytics.last-screen";

function readLastAnnounced(): string | null {
  try {
    return window.sessionStorage.getItem(LAST_ANNOUNCED_KEY);
  } catch {
    return null;
  }
}

function writeLastAnnounced(key: string): void {
  try {
    window.sessionStorage.setItem(LAST_ANNOUNCED_KEY, key);
  } catch {
    // 저장소를 못 쓰면 다시 불러올 때 한 번 더 알릴 뿐이다.
  }
}

/**
 * 화면이 바뀌었다고 알린다. 같은 화면 · 같은 section이면 무시한다.
 * `from`을 주지 않으면 `setNextScreenFrom` 값 → 직전 화면 이름 순으로 정한다.
 */
export function reportScreen(
  screen: Screen,
  from?: ScreenFrom,
  options: { pathname?: string; href?: string; documentLoad?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  // 경로를 넣어 같은 화면 이름의 다른 글 · 다음 밸런스 판으로 가는 이동도 센다. 쿼리만 바뀌면 같다.
  const pathname = options.pathname ?? window.location.pathname;
  const key = `${screen.name}:${screen.section ?? ""}:${pathname}`;
  if (current?.key === key) {
    nextFrom = undefined;
    return;
  }
  const previous = current?.name;
  current = { key, name: screen.name };
  const resolvedFrom = from ?? nextFrom ?? previous;
  nextFrom = undefined;

  const params: ScreenViewParams = {
    screen_name: screen.name,
    screen_class: "webview",
    from: resolvedFrom,
    section: screen.section,
  };
  if (detectPlatform() === "web") {
    sendWhenSeen({ params, href: options.href ?? window.location.href });
    return;
  }
  // 같은 웹뷰가 같은 화면을 다시 불러왔으면 앱은 이미 이 화면을 안다.
  if (options.documentLoad && readLastAnnounced() === key) return;
  track("screen_view", params);
  // 앱에 실제로 넘어간 뒤(WEBVIEW_READY 뒤 대기열이 비워질 때) 적는다 — 그 전에 문서가 다시 불러와지면
  // 앱은 이 화면을 받은 적이 없으므로 다시 알려야 한다.
  whenWebViewReady(() => writeLastAnnounced(key));
}

/**
 * 주소로 화면을 알린다(문서 로드 · 라우터 이동). 기록하지 않는 주소면 지금 화면을 비운다 —
 * 그 뒤 기록하는 화면으로 돌아오면 다시 센다.
 */
export function reportScreenForUrl(
  url: string,
  options: { documentLoad?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return;
  }
  const screen = screenOf(parsed.pathname, parsed.searchParams);
  if (!screen) {
    current = null;
    nextFrom = undefined;
    flushPendingIfVisible();
    cancelPendingBrowserView();
    return;
  }
  reportScreen(screen, fromOfUrl(parsed.searchParams) ?? nextFrom, {
    pathname: parsed.pathname,
    href: parsed.href,
    documentLoad: options.documentLoad,
  });
}

/**
 * 문서 로드 때 지금 화면. 앱 웹뷰가 같은 화면을 다시 불러온 문서면 알리지 않는다(reportScreen).
 * 브라우저의 새로고침은 방문으로 센다(웹 태그 기본과 같게).
 */
export function reportDocumentScreen(): void {
  if (typeof window === "undefined") return;
  reportScreenForUrl(window.location.href, { documentLoad: true });
}

/** 브라우저 bfcache 복원(뒤로 가기)은 같은 화면이어도 다시 센다. */
export function reportRestoredPage(): void {
  // 떠나기 전 1초를 못 채운 대기분은 버린다 — 복원된 화면을 새로 센다.
  cancelPendingBrowserView();
  current = null;
  reportScreenForUrl(window.location.href);
}

// ---- 브라우저: 1초 넘게 보여야 보낸다 ----

/** 1초를 기다리는 화면 기록과 그 화면 주소(page_location — 이동 중에 타이머가 끝나도 앞 주소가 실리지 않게). */
type PendingBrowserView = { params: ScreenViewParams; href: string };
let pendingBrowserView: PendingBrowserView | null = null;
let visibleTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityListening = false;

function flushPendingIfVisible(): void {
  if (pendingBrowserView && document.visibilityState === "visible") {
    sendBrowserView(pendingBrowserView);
  }
}

function cancelPendingBrowserView(): void {
  pendingBrowserView = null;
  if (visibleTimer !== null) {
    clearTimeout(visibleTimer);
    visibleTimer = null;
  }
}

function sendBrowserView(view: PendingBrowserView): void {
  track("screen_view", view.params, { pageLocation: view.href });
}

function sendWhenSeen(view: PendingBrowserView): void {
  // 보이는 채로 다른 화면으로 넘어갔으면 앞 화면은 본 것이다(짧은 노출 규칙은 숨김 · 보임 깜빡임을 거르는 것).
  flushPendingIfVisible();
  cancelPendingBrowserView();
  pendingBrowserView = view;
  if (!visibilityListening) {
    visibilityListening = true;
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  onVisibilityChange();
}

function onVisibilityChange(): void {
  if (!pendingBrowserView) return;
  if (document.visibilityState !== "visible") {
    // 1초 전에 숨으면 이번 노출은 세지 않고, 다음에 보일 때 다시 1초를 잰다.
    if (visibleTimer !== null) {
      clearTimeout(visibleTimer);
      visibleTimer = null;
    }
    return;
  }
  if (visibleTimer !== null) return;
  visibleTimer = setTimeout(() => {
    visibleTimer = null;
    const view = pendingBrowserView;
    pendingBrowserView = null;
    if (view) sendBrowserView(view);
  }, BROWSER_MIN_VISIBLE_MS);
}
