import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createCreateCommentUseCase,
  createGetCommentsUseCase,
} from "@/features/community/application/community-use-case-factory";
import { normalizeCommentSort } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/posts/{id}/comments?sort=&cursor= — 댓글 목록(공개 읽기).
 *
 * 세션 토큰이 있으면 부착해 각 댓글의 isOwner(삭제 노출 판단)를 채운다.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/community/posts/[id]/comments">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const sort = normalizeCommentSort(
    request.nextUrl.searchParams.get("sort") ?? undefined,
  );
  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const accessToken = await readSessionToken();

  try {
    const data = await createGetCommentsUseCase(accessToken).execute(
      parsed.postId,
      sort,
      cursor,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "comments", "댓글 조회에 실패했습니다.");
  }
}

/**
 * POST /api/community/posts/{id}/comments — 댓글/대댓글 작성(인증 필요).
 *
 * body: { content: string, parentId?: number }
 * parentId가 있으면 그 댓글의 답글로 달린다. 숫자가 아니거나 0 이하면 최상위 댓글로 취급한다.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/community/posts/[id]/comments">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let content = "";
  let parentId: number | undefined;
  try {
    const body = await request.json();
    content = String(body?.content ?? "").trim();
    const rawParentId = Number(body?.parentId);
    // 0/NaN/음수는 "부모 없음"으로 본다 — 업스트림에는 0으로 나간다.
    parentId = Number.isInteger(rawParentId) && rawParentId > 0 ? rawParentId : undefined;
  } catch {
    // 파싱 실패는 아래 빈 값 검증에서 400으로 처리된다.
  }

  if (!content) {
    return jsonError("댓글 내용을 입력해 주세요.", 400);
  }

  try {
    const data = await createCreateCommentUseCase(session.accessToken).execute(
      parsed.postId,
      content,
      parentId,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "comment-create", "댓글 작성에 실패했습니다.");
  }
}
