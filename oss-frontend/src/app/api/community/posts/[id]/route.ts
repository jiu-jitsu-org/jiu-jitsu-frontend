import { NextResponse } from "next/server";

import {
  parsePostBody,
  parsePostId,
  requireSessionOr401,
  toErrorResponse,
  validatePostBody,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createDeletePostUseCase,
  createGetPostDetailUseCase,
  createUpdatePostUseCase,
} from "@/features/community/application/community-use-case-factory";
import { withoutCompetitionWhenDisabled } from "@/features/competition/application/is-competition-enabled";
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
    const loaded = await createGetPostDetailUseCase(accessToken).execute(
      parsed.postId,
    );
    // 목록·상세 화면과 같이, 대회 기능이 꺼진 배포에선 대회 카드를 뗀다(competitionId는 남긴다).
    // 피드가 상세에 다녀온 글을 이 경로로 다시 읽어 카드를 갈아 끼운다(#449).
    const [data] = withoutCompetitionWhenDisabled([loaded]);

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "detail", "게시글 조회에 실패했습니다.");
  }
}

/**
 * DELETE /api/community/posts/{id} — 게시글 삭제(인증 필요).
 *
 * 업스트림 DELETE /board/{id}로 위임. 본인 게시글 권한은 업스트림이 최종 검사한다.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/posts/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createDeletePostUseCase(session.accessToken).execute(parsed.postId);

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "delete", "게시글 삭제에 실패했습니다.");
  }
}

/**
 * PUT /api/community/posts/{id} — 게시글 수정(인증 필요).
 *
 * body: { categoryId, title, body, imageFileIdList, tags, competitionId } — 생성과 같은 형태. competitionId는 null·생략이면 대회 연결을 푼다(#417). 업스트림 PUT /board/{id}로
 * 위임하며 imageFileIdList·tags는 "남길 전체 목록"(서버가 목록을 통째로 교체). 본인 게시글 권한은 업스트림이
 * 최종 검사한다.
 */
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/community/posts/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parsePostId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  const fields = await parsePostBody(request);
  const invalid = validatePostBody(fields);
  if (invalid) return invalid;

  try {
    await createUpdatePostUseCase(session.accessToken).execute(
      parsed.postId,
      fields,
    );

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "update", "게시글 수정에 실패했습니다.");
  }
}
