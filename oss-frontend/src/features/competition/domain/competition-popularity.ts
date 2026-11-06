/**
 * "관심 많은 대회" 기준 (#336).
 *
 * 상위 n개가 아니라 관심 수 n 이상으로 정한다. 상위 n개는 관심이 거의 없는 시기에도 늘 몇 개를 표시해
 * 표시의 뜻이 흐려지고, 대회가 하나 늘거나 줄 때마다 다른 대회의 표시가 붙었다 떨어진다.
 * 수 기준은 대회마다 따로 정해져 목록을 거르거나 달을 넘겨도 같은 대회는 같은 표시를 갖는다.
 * 50은 2026년 대회 수(한 달 평균 14건)와 지금 사용자 규모에서 한 달에 몇 개만 걸리도록 잡은 임시 값이다 —
 * 실제 관심 수가 쌓이면 분포를 보고 다시 정한다.
 */
export const POPULAR_INTEREST_THRESHOLD = 50;

export function isPopularCompetition(interestCount: number): boolean {
  return interestCount >= POPULAR_INTEREST_THRESHOLD;
}
