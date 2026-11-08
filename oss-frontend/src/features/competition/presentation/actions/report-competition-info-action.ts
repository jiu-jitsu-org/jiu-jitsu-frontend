"use server";

import { createReportCompetitionInfoUseCase } from "@/features/competition/application/competition-use-case-factory";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import {
  COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH,
  COMPETITION_INFO_REPORT_REASONS,
  isCompetitionInfoReportReason,
} from "@/features/competition/domain/competition-info-report";
import { readSessionToken } from "@/shared/lib/auth";

export type ReportCompetitionInfoResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "failed" };

/**
 * "정보가 달라요" 제보 Server Action (#365).
 *
 * 로그인한 사람만 보낸다 — 아무나 같은 제보를 쏟아붓지 못하게(커뮤니티 신고와 같은 기준).
 * 화면 밖에서도 부를 수 있는 입구라 값 모양부터 다시 본다.
 */
export async function reportCompetitionInfoAction(
  competitionId: string,
  reason: string,
  detail?: string,
): Promise<ReportCompetitionInfoResult> {
  // 대회 데이터가 가짜인 동안은 대회 탭을 여는 환경에서만 받는다.
  if (!isCompetitionPageEnabled()) return { ok: false, reason: "failed" };
  if (
    typeof competitionId !== "string" ||
    competitionId.length === 0 ||
    competitionId.length > 100 ||
    !isCompetitionInfoReportReason(reason) ||
    (detail !== undefined &&
      (typeof detail !== "string" ||
        detail.length > COMPETITION_INFO_REPORT_DETAIL_MAX_LENGTH))
  ) {
    return { ok: false, reason: "failed" };
  }
  // 직접 적는 글은 "다른 정보"에만 받고, 그때는 비어 있으면 안 된다 — 무엇이 다른지 모르는 제보가 된다.
  const allowsDetail = COMPETITION_INFO_REPORT_REASONS.some(
    (option) => option.value === reason && "allowsCustomText" in option,
  );
  const trimmed = detail?.trim() ?? "";
  if (allowsDetail ? trimmed === "" : trimmed !== "") {
    return { ok: false, reason: "failed" };
  }
  if ((await readSessionToken()) === null) {
    return { ok: false, reason: "unauthenticated" };
  }

  try {
    await createReportCompetitionInfoUseCase().execute(
      competitionId,
      reason,
      trimmed || undefined,
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
