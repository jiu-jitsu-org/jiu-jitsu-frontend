import { createGetMyRecordedCompetitionIdsUseCase } from "@/features/community/application/community-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";

/**
 * 내 대회 기록에 걸린 대회 id (#545) — 결과 남기기 배너(상세) · 카드(대회 탭)를 이미 기록한 대회에 띄우지 않는다.
 * 비로그인이거나 못 읽으면 null — 그때는 지금처럼 띄운다(덧붙는 정보라 화면을 막지 않는다).
 * 내 프로필(서버)을 보므로 다른 기기에서 남긴 기록도 걸러진다.
 */
export async function loadMyRecordedCompetitionIds(): Promise<ReadonlySet<number> | null> {
  try {
    const accessToken = await readSessionToken();
    if (!accessToken) return null;
    return new Set(
      await createGetMyRecordedCompetitionIdsUseCase(accessToken).execute(),
    );
  } catch {
    return null;
  }
}
