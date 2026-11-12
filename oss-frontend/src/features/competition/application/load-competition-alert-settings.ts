import { createGetCompetitionAlertSettingsUseCase } from "@/features/competition/application/competition-use-case-factory";
import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import { readSessionToken } from "@/shared/lib/auth";

/**
 * 관심 대회 알림 설정(#375 · #422) — 화면 데이터가 함께 싣는다(대회 탭·대회 상세·피드·글 상세).
 * 비로그인이거나 못 읽어도 화면을 막지 않는다 — null이면 첫 관심 등록 시트와 대회 알림 켜기만 빠진다.
 */
export async function loadCompetitionAlertSettings(): Promise<CompetitionAlertSettings | null> {
  try {
    const accessToken = await readSessionToken();
    if (!accessToken) return null;
    return await createGetCompetitionAlertSettingsUseCase(accessToken).execute();
  } catch {
    return null;
  }
}
