import { NextResponse, type NextRequest } from "next/server";

import {
  jsonError,
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
 * GET /api/community/comments — 최상위 댓글 목록 한 페이지(상세 댓글 무한 스크롤, #222).
 *
 * query: contentId(게시글·밸런스 게임) · page(0부터) · sort(latest|oldest)
 *
 * 첫 페이지는 상세 SSR이 직접 받으므로 화면은 page=1부터 부르지만, 이미 펼친 페이지를 다시
 * 맞출 때도 같은 경로를 쓰므로 0도 받는다.
 *
 * 세션을 강제하지 않는다 — 대댓글 더보기와 같이 비로그인도 열람하는 읽기라, 토큰이 있으면
 * viewer 상태(isLiked·isAuthor)까지 채워지고 없으면 익명 조회로 내려간다.
 * sort를 반드시 함께 보낸다 — 첫 페이지와 정렬이 어긋나면 이미 본 댓글이 다시 오거나 빠진다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const contentId = Number(searchParams.get("contentId"));
  if (!Number.isInteger(contentId) || contentId <= 0) {
    return jsonError("잘못된 컨텐츠 ID입니다.", 400);
  }

  const page = Number(searchParams.get("page") ?? 0);
  if (!Number.isInteger(page) || page < 0) {
    return jsonError("잘못된 페이지 번호입니다.", 400);
  }

  const sort = normalizeCommentSort(searchParams.get("sort") ?? undefined);

  const accessToken = await readSessionToken();

  try {
    const data = await createGetCommentsUseCase(accessToken).execute(
      contentId,
      sort,
      page,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "comment-list", "댓글을 불러오지 못했습니다.");
  }
}

/**
 * POST /api/community/comments — 댓글/대댓글 작성(인증 필요).
 *
 * body: { contentId: number, content: string, parentId?: number, mentionCommentId?: number }
 * parentId가 있으면 그 댓글의 답글로 달린다. 숫자가 아니거나 0 이하면 최상위 댓글로 취급한다.
 * mentionCommentId는 대댓글의 답글 버튼을 누른 그 대댓글 id다(#473) — 서버가 그 작성자에게 답글 알림을
 * 보낸다(backend#219). 숫자가 아니거나 0 이하면 보내지 않는다(태그 없는 답글). 같은 스레드인지 등
 * 검증은 업스트림 몫이다(아니면 400 R0002).
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
  let mentionCommentId: number | undefined;
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

    // 대댓글 작성(parentId 있음)일 때만 싣는다 — 최상위 댓글에 태그를 붙이면 업스트림이 400(R0002)이다.
    const rawMentionCommentId = body?.mentionCommentId;
    mentionCommentId =
      parentId !== undefined &&
      typeof rawMentionCommentId === "number" &&
      Number.isInteger(rawMentionCommentId) &&
      rawMentionCommentId > 0
        ? rawMentionCommentId
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
      mentionCommentId,
    );

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "comment-create", "댓글 작성에 실패했습니다.");
  }
}
