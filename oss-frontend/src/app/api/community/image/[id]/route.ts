import { NextResponse } from "next/server";

import {
  parseImageId,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createDeleteImageUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * DELETE /api/community/image/{id} — 글에 붙지 않고 버려진 내 TEMP 이미지 삭제(인증 필요, #146).
 *
 * 업스트림 DELETE /image/{id}로 위임. 내 이미지인지는 업스트림이 최종 검사한다(backend#145).
 * 작성 화면이 결과를 기다리지 않고 부르는 best-effort 정리라, 실패해도 서버 배치(backend#144)가 수거한다.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/community/image/[id]">,
) {
  const { id } = await ctx.params;
  const parsed = parseImageId(id);
  if ("response" in parsed) return parsed.response;

  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    await createDeleteImageUseCase(session.accessToken).execute(parsed.imageId);

    return NextResponse.json<ApiSuccessResponse<null>>(
      { success: true, data: null },
      { status: 200 },
    );
  } catch (error) {
    return toErrorResponse(error, "image-delete", "이미지 삭제에 실패했습니다.");
  }
}
