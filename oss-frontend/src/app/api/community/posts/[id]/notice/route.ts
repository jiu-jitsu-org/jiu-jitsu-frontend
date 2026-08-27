import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleNoticeUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/posts/{id}/notice — 게시글 알림 수신 토글(인증 필요).
 *
 * 업스트림 PUT /notice/setting/board/{boardId}로 위임한다(단일 엔드포인트 on/off).
 * 응답으로 토글 후 수신 여부(enabled)를 돌려줘, 클라이언트가 낙관적으로 뒤집은 종 아이콘을
 * 서버 진실값으로 확정할 수 있게 한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/notice">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const enabled = await createToggleNoticeUseCase(session.accessToken).execute(
      parsed.postId,
    );

    return NextResponse.json<ApiSuccessResponse<{ enabled: boolean }>>(
      { success: true, data: { enabled } },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "notice", "알림 설정에 실패했습니다.");
  }
}
