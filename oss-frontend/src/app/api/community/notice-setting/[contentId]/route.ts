import { NextResponse } from "next/server";

import {
  parseContentId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createGetNoticeEnabledUseCase,
  createToggleNoticeUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * 컨텐츠 알림 수신 설정 (인증 필요).
 *
 * GET  — 현재 수신 여부
 * POST — 토글하고 토글 후 수신 여부를 반환
 *
 * WHY 게시글 아래(`/posts/{id}/notice`)가 아니라 여기인가: 업스트림이 이미 중립이다.
 * `/notice/setting/board/{id}`의 `{id}`는 경로에 board가 들어가 있을 뿐 실제로는 contentId라,
 * 게시글과 밸런스 게임이 같은 엔드포인트를 쓴다(BE 확인). BFF 경로만 게시글 아래 두면
 * 밸런스 게임이 게시글 이름을 빌려 쓰게 되고 그 순간 경로가 거짓말을 한다 — 댓글 작성
 * (`/api/community/comments`)을 옮긴 것과 같은 이유다.
 *
 * 토글이 POST인 이유: 업스트림은 PUT이지만 BFF의 다른 토글(좋아요·저장·숨김)이 모두 POST라
 * 클라이언트 쪽 호출 형태를 맞춘다.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/community/notice-setting/[contentId]">,
) {
  const { contentId } = await ctx.params;
  const parsed = parseContentId(contentId);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const enabled = await createGetNoticeEnabledUseCase(
      session.accessToken,
    ).execute(parsed.contentId);

    return NextResponse.json<ApiSuccessResponse<{ enabled: boolean }>>({
      success: true,
      data: { enabled },
    });
  } catch (error) {
    return toErrorResponse(error, "notice", "알림 설정을 불러오지 못했습니다.");
  }
}

/**
 * 토글 후 수신 여부(enabled)를 돌려줘, 클라이언트가 낙관적으로 뒤집은 종 아이콘을
 * 서버 진실값으로 확정할 수 있게 한다.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/community/notice-setting/[contentId]">,
) {
  const { contentId } = await ctx.params;
  const parsed = parseContentId(contentId);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const enabled = await createToggleNoticeUseCase(
      session.accessToken,
    ).execute(parsed.contentId);

    return NextResponse.json<ApiSuccessResponse<{ enabled: boolean }>>({
      success: true,
      data: { enabled },
    });
  } catch (error) {
    return toErrorResponse(error, "notice", "알림 설정에 실패했습니다.");
  }
}
