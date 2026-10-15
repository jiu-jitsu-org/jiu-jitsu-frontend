/**
 * 서버 날짜·시간 해석과 공통 시간 표기 (시간 표시 정책 1 · 2, #188).
 *
 * 서버 계약: 날짜·시간은 타임존 표기 없는 KST다("2026-10-15T14:58:52.663531"). 서비스가 국내 전용이라
 * BE와 구두로 합의했다. 문자열을 그대로 `Date`에 넣으면 실행 환경(FE 서버 컨테이너는 UTC, 기기는
 * 사용자 설정)의 타임존으로 해석돼 9시간까지 어긋난다 — 그래서 해석 · 표기 모두 KST를 명시한다.
 *
 * KST는 서머타임이 없어 UTC+9 고정이다. Intl 대신 오프셋 산술로 달력 값을 뽑는 이유: 실행 환경의
 * ICU 데이터와 무관하게 서버 · 클라이언트가 항상 같은 문자열을 만든다(하이드레이션 불일치 방지).
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** 이 일수부터는 상대 표기 대신 날짜로 쓴다(정책: 1~6일 → N일 전, 7일 이상 → 날짜). */
const DATE_LABEL_FROM_DAYS = 7;

/**
 * 서버 날짜·시간 문자열 → 오프셋이 명시된 ISO 문자열.
 *
 * - 오프셋이 없으면 KST(+09:00)로 붙인다. 이미 있으면(Z · ±HH:MM) 그대로 둔다.
 * - 소수점 이하 초는 3자리로 자른다. 서버는 나노초까지 보내는데 ECMAScript가 규정한 형식은
 *   밀리초까지라, iOS 웹뷰(JavaScriptCore)가 그 이상을 파싱한다는 보장이 없다.
 *
 * infrastructure가 응답을 domain으로 옮길 때 한 번 호출한다 — 이후 계층은 타임존을 신경 쓰지 않는다.
 */
export function toKstIso(raw: string): string {
  const trimmed = raw.trim().replace(/(\.\d{3})\d+/, "$1");
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed) ? trimmed : `${trimmed}+09:00`;
}

/** KST 달력 값. 월은 1부터. */
function kstCalendar(epochMs: number) {
  const shifted = new Date(epochMs + KST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

/**
 * 공통 상대 시간 표기 — 게시글 리스트 · 상세 · 댓글 · 대댓글 · 알림함이 모두 이 규칙을 쓴다.
 *
 * - 1분 미만 → 방금 전 (서버·기기 오차로 미래 시각이 나와도 방금 전)
 * - 1분 ~ 59분 → N분 전
 * - 1시간 ~ 23시간 → N시간 전
 * - 1일 ~ 6일 → N일 전
 * - 7일 이상, 올해 → M월 D일
 * - 7일 이상, 해가 바뀜 → YY년 M월 D일
 *
 * now는 서버 시각 기준값을 받는다(ServerClock). 기기 시계를 직접 쓰지 않는다.
 * 파싱할 수 없으면 빈 문자열 — "NaN분 전"을 보여주느니 비워 두는 편이 낫다.
 */
export function formatRelativeTime(iso: string, now: number): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";

  const elapsed = now - time;
  if (elapsed < MINUTE_MS) return "방금 전";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}분 전`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}시간 전`;

  const days = Math.floor(elapsed / DAY_MS);
  if (days < DATE_LABEL_FROM_DAYS) return `${days}일 전`;

  const date = kstCalendar(time);
  const monthDay = `${date.month}월 ${date.day}일`;
  if (date.year === kstCalendar(now).year) return monthDay;

  return `${String(date.year).slice(2)}년 ${monthDay}`;
}

/**
 * 정확 시각 "YY년 M월 D일 HH:mm" (KST). 게시글 상세에서 시간을 탭했을 때만 쓴다(정책 2).
 * 파싱할 수 없으면 빈 문자열.
 */
export function formatExactDateTime(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";

  const date = kstCalendar(time);
  const hh = String(date.hours).padStart(2, "0");
  const mm = String(date.minutes).padStart(2, "0");

  return `${String(date.year).slice(2)}년 ${date.month}월 ${date.day}일 ${hh}:${mm}`;
}
