/**
 * 메인 홈 '어제의 밸런스 게임' 결과(#681)를 이 기기에서 본 기록.
 *
 * 본 어제 날짜와 계정("YYYY-MM-DD.<계정>", 서버가 정해 준다)을 쿠키에 남긴다. 계정까지 담는 이유: 같은 기기에서
 * 다른 계정으로 바꾸면 그 계정은 아직 어제 결과를 보지 않았다. 히어로 인트로(balance-intro)와 같은 이유로 쿠키다 —
 * 서버가 그리기 전에 읽어 이미 봤으면 처음부터 오늘 판을 그린다. 클라이언트에서 가르면 어제 결과가 그려졌다가
 * 오늘 판으로 바뀌는 깜빡임이 생긴다. 서버는 이 날짜가 어제면 참여 목록을 읽지도 않는다.
 */
export const BALANCE_YESTERDAY_SEEN_COOKIE = "balance_yesterday_seen";

/** 이틀이면 그다음 날 판이 올 때 이미 지나 있다 — 하루 한 판이라 하루 지난 기록은 쓸 데가 없다. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 2;

const SEEN_KEY = /^\d{4}-\d{2}-\d{2}\.[A-Za-z0-9_-]{1,64}$/;

/** 쿠키 값 → 본 기록. 형식이 아니면 null(안 본 것). */
export function readYesterdaySeen(value: string | undefined): string | null {
  return value && SEEN_KEY.test(value) ? value : null;
}

/** 어제 결과를 본 것으로 남긴다. 값은 서버가 정해 준 그대로다(BalanceYesterdayResult.seenKey). */
export function markYesterdaySeen(seenKey: string): void {
  if (!SEEN_KEY.test(seenKey)) return;
  document.cookie = `${BALANCE_YESTERDAY_SEEN_COOKIE}=${seenKey}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}
