import { NextResponse } from "next/server";

import {
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createToggleBookmarkUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/posts/{id}/bookmarks — 게시글 저장(북마크) 토글(인증 필요).
 *
 * 업스트림 PUT /board/save/{id}로 위임한다(단일 엔드포인트 저장/취소).
 * 응답으로 토글 후 저장 상태(saved)를 돌려줘 클라이언트가 낙관적 상태를 보정한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/bookmarks">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const saved = await createToggleBookmarkUseCase(
      session.accessToken,
    ).execute(parsed.postId);

    return NextResponse.json<ApiSuccessResponse<{ saved: boolean }>>(
      { success: true, data: { saved } },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "bookmark", "저장 처리에 실패했습니다.");
  }
}
