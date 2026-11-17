// 앱 여부 · 버전(#510). 힌트는 서버에서만 깐다 — 서버 컴포넌트 AppClientHint(./app-client-hint)를 경로로 import한다.
export { appVersionAtLeast, type AppClient } from "./app-client";
export { useAppClientHint, useAppVersion } from "./app-client-context";
