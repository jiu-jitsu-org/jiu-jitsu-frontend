import { NextResponse } from "next/server";

import {
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createGetImageUploadAuthUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/image/auth — ImageKit 업로드용 서명 발급(①, 인증 필요).
 *
 * 응답 { token, expire, signature }은 브라우저가 ImageKit 업로드(②)에 그대로 사용한다.
 * 서명 자체는 비밀이 아니지만, 발급은 로그인 사용자에게만 허용한다.
 */
export async function GET() {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const data = await createGetImageUploadAuthUseCase(
      session.accessToken,
    ).execute();

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "image-auth", "이미지 서명 발급에 실패했습니다.");
  }
}
