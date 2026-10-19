import { NextResponse } from "next/server";

import {
  parseNotificationId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createMarkInboxNotificationReadUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 알림 개별 읽음 (인증 필요, #187).
 *
 * PUT — 업스트림 PUT /notice/{id}. 내 알림이 아니면 403(PERMISSION_DENIED), 없으면 404가 그대로 내려간다.
 */
export async function PUT(
  _request: Request,
  ctx: RouteContext<"/api/community/notifications/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parseNotificationId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createMarkInboxNotificationReadUseCase(session.accessToken).execute(
      parsed.notificationId,
    );

    return NextResponse.json<ApiSuccessResponse<null>>({
      success: true,
      data: null,
    });
  } catch (error) {
    return toErrorResponse(
      error,
      "inbox-read",
      "알림을 읽음 처리하지 못했습니다.",
    );
  }
}
