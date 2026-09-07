import { NextResponse, type NextRequest } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createCreateCommentUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/comments — 댓글/대댓글 작성(인증 필요).
 *
 * body: { contentId: number, content: string, parentId?: number }
 * parentId가 있으면 그 댓글의 답글로 달린다. 숫자가 아니거나 0 이하면 최상위 댓글로 취급한다.
 *
 * WHY 게시글 아래(`/posts/{id}/comments`)가 아니라 여기인가: 업스트림이 이미 중립이다
 * (`POST /community/comments`의 body는 `{ contentId, parentId, body }`). 댓글이 달리는 대상은
 * 게시글일 수도 밸런스 게임일 수도 있고, 앞으로 다른 컨텐츠가 생겨도 같다. 경로에 `posts`가
 * 들어가 있으면 밸런스 게임이 게시글 이름을 빌려 쓰게 되고, 그 순간 경로가 거짓말을 한다.
 *
 * contentId를 path가 아니라 body로 받는 이유도 업스트림과 같은 모양을 유지하기 위해서다 —
 * 이 route는 세션 부착과 입력 검증만 하고 형태를 바꾸지 않는다.
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let contentId: number | undefined;
  let content = "";
  let parentId: number | undefined;
  try {
    const body = await request.json();

    const rawContentId = Number(body?.contentId);
    contentId =
      Number.isInteger(rawContentId) && rawContentId > 0
        ? rawContentId
        : undefined;

    content = String(body?.content ?? "").trim();

    const rawParentId = Number(body?.parentId);
    // 0/NaN/음수는 "부모 없음"으로 본다 — 업스트림에는 0으로 나간다.
    parentId =
      Number.isInteger(rawParentId) && rawParentId > 0
        ? rawParentId
        : undefined;
  } catch {
    // 파싱 실패는 아래 검증에서 400으로 처리된다.
  }

  if (!contentId) {
    return jsonError("잘못된 컨텐츠 ID입니다.", 400);
  }

  if (!content) {
    return jsonError("댓글 내용을 입력해 주세요.", 400);
  }

  try {
    const data = await createCreateCommentUseCase(session.accessToken).execute(
      contentId,
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
