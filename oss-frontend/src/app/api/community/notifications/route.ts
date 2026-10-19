import { NextResponse } from "next/server";

import {
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createMarkAllInboxNotificationsReadUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 알림함 모두 읽음 (인증 필요, #187).
 *
 * PUT — 업스트림 PUT /notice. 목록 조회는 SSR(get-inbox-page-data)이 하므로 GET은 두지 않는다.
 */
export async function PUT() {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createMarkAllInboxNotificationsReadUseCase(
      session.accessToken,
    ).execute();

    return NextResponse.json<ApiSuccessResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "inbox-read-all",
      "알림을 읽음 처리하지 못했습니다.",
    );
  }
}
