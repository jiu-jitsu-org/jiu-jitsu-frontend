"use server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { recordCompetitionView } from "@/features/competition/application/get-competition-detail-page-data";
import { isCompetitionId } from "@/features/competition/domain/competition";

/**
 * 대회 상세 조회수 +1 Server Action (#362 · #420) — 사람이 상세를 열었을 때 화면이 한 번 부른다.
 * 서버 렌더에서 세지 않는 이유: 로그인 뒤 다시 그리기·공유 미리보기에서도 돌아 두 번 센다.
 * 센 뒤의 조회수를 돌려준다. 실패면 null — 화면은 처음 받은 숫자를 그대로 둔다.
 */
export async function recordCompetitionViewAction(
  competitionId: number,
): Promise<number | null> {
  if (!isCompetitionEnabled() || !isCompetitionId(competitionId)) return null;
  return recordCompetitionView(competitionId);
}
