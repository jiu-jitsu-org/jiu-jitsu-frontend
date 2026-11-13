import type { Competition } from "@/features/competition/domain/competition";
import { longDateLabel } from "@/features/competition/presentation/competition-detail-format";

/**
 * 공유 미리보기 설명 줄(#369) — "2026년 11월 22일(일) · 서울 송파 · 관심 128".
 * 미리보기는 받는 사람이 언제 보든 같아야 해서 날짜에 늘 연도·요일을 붙이고, 관심이 없으면 관심 수를 뺀다.
 * 로그인 조회 결과로도 그려지므로(#443) 사람마다 같은 값만 받는다 — 내 관심 여부 · 알림 여부가 섞이지 않게
 * 인자를 이 필드들로 좁혀 둔다.
 */
export function competitionShareSummary(data: {
  competition: Pick<Competition, "date" | "place">;
  interestCount: number;
}): string {
  const { competition } = data;
  return [
    // 받는 사람이 해가 바뀐 뒤에 볼 수도 있어 늘 연도를 붙인다.
    longDateLabel(competition.date, null),
    competition.place.trim(),
    data.interestCount > 0 ? `관심 ${data.interestCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
