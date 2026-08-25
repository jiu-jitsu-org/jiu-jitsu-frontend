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
 * 응답으로 토글 후 저장 상태(saved)와 서버가 계산한 저장 수(saveCount)를 돌려줘
 * 클라이언트가 낙관적 상태와 카운트를 서버 값으로 확정한다.
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
    const { saved, saveCount } = await createToggleBookmarkUseCase(
      session.accessToken,
    ).execute(parsed.postId);

    // saveCount가 없는 구버전 응답에서는 키 자체를 빼서, 클라이언트가 로컬 계산으로 폴백하게 둔다.
    return NextResponse.json<
      ApiSuccessResponse<{ saved: boolean; saveCount?: number }>
    >(
      {
        success: true,
        data: typeof saveCount === "number" ? { saved, saveCount } : { saved },
      },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "bookmark", "저장 처리에 실패했습니다.");
  }
}
