/**
 * 대회 목록 시안 (#348) — 주소 뒤 `?look=b`·`?look=c`로 바꿔 본다. 고르면 남은 안과 이 파일을 지운다.
 *
 * - a: 달 카드 하나에 대회 줄을 모음, 왼쪽 날짜 (기본)
 * - b: a와 같은 달 카드, 왼쪽에 포스터 썸네일·날짜는 설명 줄 앞으로
 * - c: 대회마다 흰 카드 한 장(인보이스 목록 참고), 점선 아래 상태 칩·남은 날
 *
 * 대회 탭은 아직 로컬·개발 서버에서만 열려(가짜 데이터) 운영 화면에는 영향이 없다.
 */
export type CompetitionLook = "a" | "b" | "c";

export function parseCompetitionLook(value: unknown): CompetitionLook {
  return value === "b" || value === "c" ? value : "a";
}
