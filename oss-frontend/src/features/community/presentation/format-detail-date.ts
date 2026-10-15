/**
 * 밸런스 상세 메타 행의 날짜 포맷.
 *
 * 게시글 상세의 날짜는 공통 시간 표기(shared/lib/time — 상대 시간 · 탭하면 정확 시각)를 쓴다(#188).
 * 밸런스는 "게임이 진행된 날"이라 작성 시점을 가리키는 게시글과 애초에 다른 것을 보여주므로 따로 둔다.
 */

/**
 * date-only ISO(`"2026-09-10"`) → `"26년 9월 10일"`. 형식이 다르면 원문 반환.
 *
 * 밸런스 상세 전용이다 — 기획상 밸런스는 상대 시각을 쓰지 않고 게임이 **진행된 날짜**만
 * 보여준다(시각 HH:mm 없음).
 *
 * Date로 파싱하지 않고 문자열을 직접 쪼갠다: date-only 문자열은 UTC 자정으로 해석돼
 * 음수 오프셋 타임존에서 하루 전으로 밀린다. 지금은 KST 전용이라 사고가 나지 않지만,
 * 표시할 값이 이미 문자열 안에 다 있는데 타임존을 경유할 이유가 없다.
 */
export function formatGameDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  const [, yyyy, mm, dd] = match;

  return `${yyyy.slice(2)}년 ${Number(mm)}월 ${Number(dd)}일`;
}
