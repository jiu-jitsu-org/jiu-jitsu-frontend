import { NextResponse } from "next/server";

import {
  parsePostId,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createRecordPostViewUseCase } from "@/features/community/application/community-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/posts/{id}/views — 글 상세를 사람이 연 것으로 센다(#523).
 *
 * 업스트림 POST /board/{id}/views로 위임하고 센 뒤 조회수(viewCount)를 돌려준다.
 * 상세 조회(GET)는 조회수를 올리지 않는다 — 화면을 맞추려고 같은 방문 안에서 여러 번 불리고, 링크 미리보기 수집기도 읽기 때문이다.
 * 비로그인도 센다. 세션이 있으면 붙여 작성자 본인은 첫 1회만 세게 한다(업스트림 규칙).
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]/views">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const accessToken = await readSessionToken();

  try {
    const viewCount = await createRecordPostViewUseCase(accessToken).execute(
      parsed.postId,
    );
    return NextResponse.json<ApiSuccessResponse<{ viewCount: number }>>({
      success: true,
      data: { viewCount },
    });
  } catch (error) {
    return toErrorResponse(error, "post-view", "조회수를 세지 못했습니다.");
  }
}
