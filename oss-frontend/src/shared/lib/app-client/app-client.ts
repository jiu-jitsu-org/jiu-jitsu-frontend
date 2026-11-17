/**
 * 요청이 어디서 왔는지 — OSS 앱 웹뷰 · 브라우저 · 모름 — 와 앱 버전 (#510).
 *
 * 앱은 웹뷰 User-Agent 끝에 `OSSApp/<버전> (iOS)`를 싣는다(jiu-jitsu-ios#370, 버전을 모르면 "0").
 * 서버는 이 값으로 첫 렌더를 정하고(앱 화면 / 브라우저 화면), 화면은 옛 앱과 새 웹이 맞지 않을 때 버전으로 가른다.
 *
 * '모름'을 따로 두는 이유: 이 값을 싣기 전의 앱(iOS WKWebView 기본 User-Agent)과 안드로이드 앱 웹뷰는 앱인데도
 * `OSSApp/`이 없다. 이들을 브라우저로 보면 앱 안에서 브라우저 화면이 먼저 스친다. 그래서 브라우저라고 확신할 수
 * 있는 표시(인앱 브라우저 이름 · `Safari/` · `Firefox/`)가 있을 때만 브라우저로 보고, 나머지는 모름(지금처럼 앱 기준)으로 둔다.
 */
export type AppClientSurface = "app" | "browser" | "unknown";

export type AppClient = {
  surface: AppClientSurface;
  /** 앱 버전 "1.2.0". 앱이 아니거나 모르면 null */
  version: string | null;
};

const APP_TOKEN = /\bOSSApp\/(\d+(?:\.\d+)*)/;
/**
 * 공유 링크가 열리는 인앱 브라우저 — iOS에서는 `Safari/`가 없어 이름으로 안다. 안드로이드도 웹뷰(`; wv`)라 먼저 본다.
 * 카카오톡 · 네이버 · 인스타그램 · 페이스북 · 라인 · 다음 · 밴드 · 에브리타임.
 */
const IN_APP_BROWSER =
  /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|\bLine\/|DaumApps|BAND\/|everytimeApp/i;
/** 안드로이드 웹뷰 — 우리 안드로이드 앱일 수 있어 모름. */
const ANDROID_WEBVIEW = /;\s*wv\)/;
/** 일반 브라우저 — 사파리 · 크롬(데스크톱 · 안드로이드 · iOS의 CriOS) · 엣지 · 웨일 · 삼성 인터넷은 `Safari/`, 파이어폭스는 `Firefox/`. */
const BROWSER = /\bSafari\/|\bFirefox\//;

/** User-Agent → AppClient. 앱 표시 형식이 바뀌면 iOS `WebEnvironment.swift`와 같이 바꾼다. */
export function parseAppClient(
  userAgent: string | null | undefined,
): AppClient {
  if (!userAgent) return { surface: "unknown", version: null };
  const app = APP_TOKEN.exec(userAgent);
  if (app) return { surface: "app", version: app[1] };
  if (IN_APP_BROWSER.test(userAgent))
    return { surface: "browser", version: null };
  if (ANDROID_WEBVIEW.test(userAgent))
    return { surface: "unknown", version: null };
  if (BROWSER.test(userAgent)) return { surface: "browser", version: null };
  return { surface: "unknown", version: null };
}

/**
 * 앱 버전이 min 이상인지 — "1.10.0" > "1.9.0"처럼 자리마다 숫자로 비교하고, 없는 자리는 0으로 본다.
 * 앱이 아니거나 버전을 모르면 false — 옛 앱에서 깨질 수 있는 새 동작은 이 값이 true일 때만 켠다.
 */
export function appVersionAtLeast(
  version: string | null | undefined,
  min: string,
): boolean {
  if (!version) return false;
  const have = version.split(".").map(Number);
  const need = min.split(".").map(Number);
  for (let i = 0; i < Math.max(have.length, need.length); i += 1) {
    const a = have[i] ?? 0;
    const b = need[i] ?? 0;
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    if (a !== b) return a > b;
  }
  return true;
}
