import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createCreateReportUseCase } from "@/features/community/application/community-use-case-factory";
import {
  REPORT_DETAIL_MAX_LENGTH,
  type ReportTargetType,
} from "@/features/community/domain/report";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/reports — 게시글/댓글 신고(인증 필요).
 *
 * body: { reportType: "BOARD" | "COMMENT", targetId: number, reason: string, detail?: string }
 * 업스트림 POST /reports로 위임. 동일 대상 중복 신고 차단은 업스트림이 담당한다(400 + U0008,
 * 에러 봉투는 details로 그대로 내려간다).
 */
const REPORT_TYPES: ReportTargetType[] = ["BOARD", "COMMENT"];

export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let reportType = "";
  let targetId = NaN;
  let reason = "";
  let detail = "";
  try {
    const json = await request.json();
    reportType = String(json?.reportType ?? "");
    targetId = Number(json?.targetId);
    reason = String(json?.reason ?? "").trim();
    detail = typeof json?.detail === "string" ? json.detail.trim() : "";
  } catch {
    // 파싱 실패는 아래 검증에서 400으로 처리된다.
  }

  if (!REPORT_TYPES.includes(reportType as ReportTargetType)) {
    return jsonError("유효한 신고 대상 구분이 아닙니다.", 400);
  }
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return jsonError("유효한 신고 대상 ID가 아닙니다.", 400);
  }
  if (!reason) {
    return jsonError("신고 사유가 필요합니다.", 400);
  }
  // 입력창이 이미 막지만, 구버전 앱(제한 없는 시트)·직접 호출로 넘어오면 서버가 500으로 실패하기 전에 막는다.
  if (detail.length > REPORT_DETAIL_MAX_LENGTH) {
    return jsonError(
      `신고 내용은 ${REPORT_DETAIL_MAX_LENGTH}자 이내로 입력해 주세요.`,
      400,
    );
  }

  try {
    await createCreateReportUseCase(session.accessToken).execute({
      reportType: reportType as ReportTargetType,
      targetId,
      reason,
      ...(detail ? { detail } : {}),
    });

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "report", "신고 처리에 실패했습니다.");
  }
}
