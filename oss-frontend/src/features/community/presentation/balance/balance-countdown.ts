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
 * 표기 조각 — 상세 배지 전용.
 *
 * 상세는 숫자와 단위의 타이포·색이 달라(숫자 Title 2, 단위 Body S) 한 문자열로는 그릴 수 없다.
 * 리스트·sticky 바는 계속 formatRemaining의 문자열을 쓴다 — 규칙이 같아야 하므로 임계값과
 * 자릿수 처리를 여기서 공유한다.
 */
export type RemainingParts =
  | {
      kind: "counting";
      /** 시간이 0이면 null — 단위째 빼서 "42분 08초 남음"이 된다. */
      hours: number | null;
      minutes: number;
      /** 2자리로 채운 초. */
      seconds: string;
    }
  | { kind: "closing-soon" };

/** 남은 밀리초 → 표기 조각. 임계값·자릿수 규칙은 formatRemaining과 같다. */
export function readRemainingParts(remainMs: number): RemainingParts {
  if (remainMs < MINUTE_MS) {
    return { kind: "closing-soon" };
  }

  const totalSeconds = Math.floor(remainMs / SECOND_MS);
  const hours = Math.floor(totalSeconds / 3600);

  return {
    kind: "counting",
    hours: hours > 0 ? hours : null,
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}

/** 1분 미만 문구 — 조각으로 나눌 것이 없어 한 덩어리로 쓴다. */
export const CLOSING_SOON_TEXT = CLOSING_SOON_LABEL;

/**
 * 소수점 이하 초를 3자리로 자른다.
 *
 * 업스트림 serverTime은 나노초까지 온다("2026-09-02T00:59:13.163132088"). ECMAScript가 규정한
 * Date Time String Format은 소수점 3자리까지라, 그 이상은 엔진별 구현에 맡겨진다. V8은 초과분을
 * 버리고 파싱하지만 iOS 웹뷰(JavaScriptCore)까지 같다고 볼 근거가 없다. NaN이 나오면 타이머 줄이
 * 통째로 사라지는 조용한 실패라 미리 규격 안으로 깎는다.
 *
 * 타임존 suffix가 붙어도 안전하다 — 소수부만 잘라내고 뒤는 그대로 둔다.
 */
function trimFractionalSeconds(iso: string): string {
  return iso.replace(/(\.\d{3})\d+/, "$1");
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
  const end = Date.parse(trimFractionalSeconds(endAt));
  const server = Date.parse(trimFractionalSeconds(serverTime));

  if (Number.isNaN(end) || Number.isNaN(server)) {
    return null;
  }

  // 이미 마감된 응답(서버 시각이 마감을 지남)은 0으로 눕힌다 — 음수는 표기 분기를 흐린다.
  return Math.max(0, end - server);
}

/**
 * 경기 시계가 무엇을 세는지 — 판의 상태마다 세는 끝 시각과 시계 밑 이름표가 다르다(#427).
 *
 * - 시작 전(상세 링크로만 들어온다): 투표 시작까지 → "시작까지"
 * - 교체 버퍼(메인이 끝난 판을 resultUntil과 함께 준다): 다음 게임이 시작할 때까지 → "다음 게임까지"
 * - 그 밖: 마감까지 → "남은 시간", 마감됐으면 0에 멈춰 "투표 종료"
 *
 * 0에 닿으면 상위가 다시 읽는다 — 시작 전이면 그 판을, 버퍼면 다음 판을. 시계 하나로 세 전환을 모두 건다.
 */
export type BalanceClockPhase = "upcoming" | "result" | "open" | "closed";

export function readBalanceClock(game: {
  endAt: string;
  closed: boolean;
  started: boolean;
  startAt?: string;
  resultUntil: string | null;
}): { phase: BalanceClockPhase; until: string } {
  if (!game.started && game.startAt) {
    return { phase: "upcoming", until: game.startAt };
  }
  if (game.closed && game.resultUntil) {
    return { phase: "result", until: game.resultUntil };
  }
  return { phase: game.closed ? "closed" : "open", until: game.endAt };
}

/** 시계 밑 이름표 — 시계가 무엇까지 세는지. 낭독기도 숫자 앞에 같은 말을 읽는다. */
export const BALANCE_CLOCK_LABEL: Record<BalanceClockPhase, string> = {
  upcoming: "시작까지",
  open: "남은 시간",
  result: "다음 게임까지",
  closed: "투표 종료",
};
