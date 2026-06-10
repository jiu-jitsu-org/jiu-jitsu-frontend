import { NextResponse } from "next/server";

import {
  parsePostId,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetPostDetailUseCase } from "@/features/community/application/community-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/posts/{id} — 게시글 상세 BFF.
 *
 * 비로그인도 열람 가능(공개 읽기). 세션 토큰이 있으면 함께 부착해 업스트림이
 * viewer(liked/bookmarked/isOwner) 상태를 채우게 한다(없어도 401 아님).
 *
 * Server Component는 보통 이 route를 거치지 않고 application use case를 직접 호출한다.
 * 이 route는 클라이언트/외부 HTTP 접근용으로 함께 제공한다.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const accessToken = await readSessionToken();

  try {
    const data = await createGetPostDetailUseCase(accessToken).execute(
      parsed.postId,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "detail", "게시글 조회에 실패했습니다.");
  }
}
