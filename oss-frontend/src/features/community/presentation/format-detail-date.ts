/**
 * 상세 메타 행의 날짜 포맷.
 *
 * 컨텐츠 종류마다 표기 규칙이 달라 함수를 나눠 둔다 — 게시글은 "작성 시점", 밸런스는
 * "게임이 진행된 날"이라 애초에 다른 것을 가리킨다. 한 함수에 플래그로 몰면 한쪽 정책이
 * 바뀔 때 다른 쪽이 따라 움직인다.
 *
 * 공통 규칙은 하나뿐이다: FE는 상대 시각을 직접 계산하지 않는다. 계산하면 같은 화면의
 * 목록 카드·댓글과 기준이나 문구가 어긋나 시각 표기가 둘로 갈린다.
 */

/**
 * ISO → "YY년 M월 D일 HH:mm". 파싱 실패 시 원문 반환.
 *
 * 게시글 상세 전용이다. 날짜의 정본은 서버가 계산한 timeAgo이고, 구버전 응답 등으로
 * timeAgo가 없을 때만 쓰는 **절대 시각 폴백**이다.
 */
export function formatDetailDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const yy = String(date.getFullYear()).slice(2);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${yy}년 ${month}월 ${day}일 ${hh}:${mm}`;
}

/**
 * date-only ISO(`"2026-09-10"`) → `"26년 9월 10일"`. 형식이 다르면 원문 반환.
 *
 * 밸런스 상세 전용이다 — 기획상 밸런스는 상대 시각을 쓰지 않고 게임이 **진행된 날짜**만
 * 보여주므로 시각(HH:mm)이 붙는 formatDetailDateTime을 쓸 수 없다. 게시글 상세는 계속
 * formatDetailDateTime을 쓰니 그쪽을 건드리는 대신 함수를 나눈다.
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
