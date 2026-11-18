// 분석 기록(GA) 공개 API(#575). 화면 코드는 track()만 부른다.
export {
  isValidAnalyticsName,
  sanitizeAnalyticsParams,
  track,
} from "./track";
export type { AnalyticsParams, AnalyticsParamValue } from "./track";
