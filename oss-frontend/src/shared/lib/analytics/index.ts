// 분석 기록(GA) 공개 API(#575 · #576 · #577 · #619 · #578).
// - 행동 기록: track(). 여는 함수의 열람 기록은 trackSelectContent, 행동의 입구는 currentScreenName(지금 화면) ·
//   currentScreenFrom(지금 화면에 들어온 길)
// - 화면 기록: 문서 로드 · 라우터 이동은 instrumentation-client가 screen-view.ts에서 직접 가져와 알린다.
//   화면 기록을 위해 화면 코드는 여는 주소 entryPath, 같은 문서 이동의 입구 setNextScreenFrom, 주소 없는 보기 전환
//   reportScreen만 쓴다.
export {
  isValidAnalyticsName,
  sanitizeAnalyticsParams,
  track,
} from "./track";
export type { AnalyticsParams, AnalyticsParamValue } from "./track";
export {
  contentIdOf,
  contentOfPath,
  type AnalyticsContentType,
} from "./content";
export {
  trackContentAlertToggle,
  trackNotificationReadAll,
  type ContentAlertFrom,
} from "./content-alert";
export { trackLoginPromptView } from "./login-prompt";
export { trackOpenAppClick } from "./open-app-click";
export {
  currentScreenFrom,
  currentScreenName,
  entryPath,
  reportScreen,
  setNextScreenFrom,
} from "./screen-view";
export {
  trackSelectContent,
  type SelectContentDetail,
} from "./select-content";
export type { ScreenFrom } from "./screens";
