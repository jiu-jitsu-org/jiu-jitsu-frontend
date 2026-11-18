// 분석 기록(GA) 공개 API(#575 · #576).
// - 행동 기록: track()
// - 화면 기록: 문서 로드 · 라우터 이동은 instrumentation-client가 screen-view.ts에서 직접 가져와 알린다.
//   화면 코드는 여는 주소 entryPath, 같은 문서 이동의 입구 setNextScreenFrom, 주소 없는 보기 전환 reportScreen만 쓴다.
export {
  isValidAnalyticsName,
  sanitizeAnalyticsParams,
  track,
} from "./track";
export type { AnalyticsParams, AnalyticsParamValue } from "./track";
export { entryPath, reportScreen, setNextScreenFrom } from "./screen-view";
export type { ScreenFrom } from "./screens";
