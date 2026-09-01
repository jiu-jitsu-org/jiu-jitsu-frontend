/**
 * 밸런스 게임 잔여 시간 계산·표기 (시간 표시 정책 6).
 *
 * 순수 함수만 둔다 — 틱·리렌더는 use-balance-countdown이 담당한다. 규칙이 한 곳에 모여 있어야
 * 풀 카드와 sticky 바가 같은 문구를 쓴다(둘의 표기 규칙은 동일하다).
 */

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;

/** 1분 미만이면 숫자를 세는 대신 이 문구로 바꾼다 — 초 단위로 사라질 시간을 정확히 세도 의미가 없다. */
const CLOSING_SOON_LABEL = "곧 종료돼요";

/**
 * 남은 밀리초 → 표기 문구.
 *
 * - 1분 미만: "곧 종료돼요"
 * - 시간이 남았으면: "20시간 15분 46초 남음"
 * - 시간이 0이면 시 단위를 빼고: "42분 08초 남음"
 *
 * 초만 2자리로 채운다(정책 예시 "42분 08초"). 시·분은 채우지 않는다 — 자릿수가 들쭉날쭉해도
 * 앞 단위가 있어 읽는 데 지장이 없고, 예시가 "15분"으로 되어 있다.
 */
export function formatRemaining(remainMs: number): string {
  if (remainMs < MINUTE_MS) {
    return CLOSING_SOON_LABEL;
  }

  const totalSeconds = Math.floor(remainMs / SECOND_MS);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const tail = `${minutes}분 ${String(seconds).padStart(2, "0")}초 남음`;

  return hours > 0 ? `${hours}시간 ${tail}` : tail;
}

/**
 * 응답 시점의 잔여 시간(ms). 파싱할 수 없으면 null.
 *
 * WHY 절대 시각을 쓰지 않는가: 기기 시계가 틀어져 있으면 endAt까지의 거리가 통째로 어긋난다.
 * 두 값의 **차이**만 쓰면 기기 시계와 무관해진다 — 서버가 "응답한 그 순간에 얼마 남았는지"가
 * 그대로 나온다. 이후 흐른 시간은 훅이 기기 시계로 재지만, 그건 짧은 구간의 경과 시간이라
 * 절대 시각의 오차와 달리 누적되지 않는다.
 *
 * 덤으로 타임존 표기가 없는 응답("2026-09-02T00:00:00")에도 안전하다. 두 값을 같은 규칙으로
 * 파싱하므로 어떤 타임존으로 해석되든 차이는 같다.
 */
export function readRemainingAtResponse(
  endAt: string,
  serverTime: string,
): number | null {
  const end = Date.parse(endAt);
  const server = Date.parse(serverTime);

  if (Number.isNaN(end) || Number.isNaN(server)) {
    return null;
  }

  // 이미 마감된 응답(서버 시각이 마감을 지남)은 0으로 눕힌다 — 음수는 표기 분기를 흐린다.
  return Math.max(0, end - server);
}
