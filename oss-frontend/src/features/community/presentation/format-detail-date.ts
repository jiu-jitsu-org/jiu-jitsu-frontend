/**
 * 상세 메타 행의 날짜 폴백 포맷.
 *
 * 날짜의 정본은 서버가 계산한 상대 시각(timeAgo)이다 — FE가 다시 계산하면 목록 카드·댓글과
 * 기준이나 문구가 어긋나 같은 화면 안에서 시각 표기가 둘로 갈린다. 이 함수는 구버전 응답 등으로
 * timeAgo가 없을 때만 쓰는 **절대 시각 폴백**이다.
 *
 * 게시글 상세와 밸런스 상세가 함께 쓴다. 두 메타 행은 항목 순서가 달라 컴포넌트를 나눠 두었지만
 * (PostMetaRow는 날짜 → 조회수, BalanceDetailMetaRow는 조회수 → 날짜), 날짜 포맷 자체는 디자인
 * 결정이 아니라 순수 변환이라 갈라 둘 이유가 없다 — 갈라 두면 한쪽만 고쳐져 조용히 어긋난다.
 */

/** ISO → "YY년 M월 D일 HH:mm". 파싱 실패 시 원문 반환. */
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
