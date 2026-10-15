export {
  formatExactDateTime,
  formatRelativeTime,
  toKstIso,
} from "./server-date-time";

/**
 * 요청 시각(ms) — Server Component가 ServerClockProvider에 넘길 기준값.
 *
 * 렌더 중 시계를 읽는 것을 의도된 동작으로 한 곳에 모은다. 서버 렌더는 요청마다 한 번이라
 * 값이 흔들리지 않고, 이 값이 곧 "서버 시각" 기준이 된다(시간 표시 정책 1).
 */
export function readServerNow(): number {
  return Date.now();
}
