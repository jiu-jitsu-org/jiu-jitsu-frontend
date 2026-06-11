import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createRegisterImageUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/image — ImageKit 업로드 결과를 서버에 등록(③, 인증 필요).
 *
 * body: { cdnId: string, imageUrl: string } → TEMP 이미지(int id)로 저장.
 * 그 id를 게시글 생성 시 imageFileIdList로 보내면 ACTIVE로 전환된다.
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let cdnId = "";
  let imageUrl = "";
  try {
    const body = await request.json();
    cdnId = String(body?.cdnId ?? "").trim();
    imageUrl = String(body?.imageUrl ?? "").trim();
  } catch {
    // 파싱 실패는 아래 빈 값 검증에서 400으로 처리된다.
  }

  if (!cdnId || !imageUrl) {
    return jsonError("등록할 이미지 정보가 올바르지 않습니다.", 400);
  }

  try {
    const data = await createRegisterImageUseCase(session.accessToken).execute({
      cdnId,
      imageUrl,
    });

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "image-register", "이미지 등록에 실패했습니다.");
  }
}
