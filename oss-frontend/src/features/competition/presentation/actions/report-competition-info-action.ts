"use server";

import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { createReportCompetitionInfoUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionId } from "@/features/competition/domain/competition";
import {
  COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH,
  CompetitionInfoReportLimitError,
  isCompetitionInfoReportReason,
  requiresReportDetail,
} from "@/features/competition/domain/competition-info-report";
import { competitionActionFailure } from "@/features/competition/presentation/actions/competition-action-failure";
import { readSessionToken } from "@/shared/lib/auth";

export type ReportCompetitionInfoResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "not-found"
        | "detail-required"
        | "limit"
        | "failed";
    };

/**
 * "정보가 달라요" 제보 Server Action (#365 · #420) — POST /competitions/{id}/info-reports.
 *
 * 로그인한 사람만 보낸다 — 아무나 같은 제보를 쏟아붓지 못하게(커뮤니티 신고와 같은 기준).
 * 맞는 정보는 모든 항목에서 받고, "다른 정보"만 꼭 적어야 한다. 같은 항목을 하루 3번 넘게 보내면 limit.
 */
export async function reportCompetitionInfoAction(
  competitionId: number,
  reason: string,
  detail?: string,
): Promise<ReportCompetitionInfoResult> {
  // 화면 밖에서도 부를 수 있는 입구라 값 모양부터 다시 본다.
  if (
    !isCompetitionEnabled() ||
    !isCompetitionId(competitionId) ||
    !isCompetitionInfoReportReason(reason) ||
    (detail !== undefined &&
      (typeof detail !== "string" ||
        detail.length > COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH))
  ) {
    return { ok: false, reason: "failed" };
  }
  const trimmed = detail?.trim() ?? "";
  if (requiresReportDetail(reason) && !trimmed) {
    return { ok: false, reason: "detail-required" };
  }
  const accessToken = await readSessionToken();
  if (accessToken === null) return { ok: false, reason: "unauthenticated" };

  try {
    await createReportCompetitionInfoUseCase(accessToken).execute(
      competitionId,
      reason,
      trimmed || undefined,
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof CompetitionInfoReportLimitError) {
      return { ok: false, reason: "limit" };
    }
    return { ok: false, reason: competitionActionFailure(error) };
  }
}
