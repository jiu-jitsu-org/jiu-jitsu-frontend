import { NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import {
  createGetMyBeltUseCase,
  createSaveMyBeltUseCase,
} from "@/features/community/application/community-use-case-factory";
import { type Belt, parseBelt } from "@/features/community/domain/belt";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * GET /api/community/profile/belt — 내 띠·그랄 조회(인증 필요, #275).
 *
 * 띠 묻기 시트가 띄우기 직전에 부른다. 아직 입력하지 않았으면 belt가 null이다.
 */
export async function GET() {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  try {
    const belt = await createGetMyBeltUseCase(session.accessToken).execute();

    return NextResponse.json<ApiSuccessResponse<{ belt: Belt | null }>>({
      success: true,
      data: { belt },
    });
  } catch (error) {
    return toErrorResponse(error, "belt-get", "띠 정보를 불러오지 못했습니다.");
  }
}

/**
 * PUT /api/community/profile/belt — 내 띠·그랄 저장(인증 필요, #275).
 *
 * body: { rank: "white" | "blue" | "purple" | "brown" | "black", grau: 0~4 }
 * 업스트림 POST /community/profile(BELT_WEIGHT)로 위임한다 — 성별·체급은 저장소가 현재 값을 지켜 보낸다.
 */
export async function PUT(request: Request) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  const belt = parseBelt(await request.json().catch(() => null));
  if (!belt) return jsonError("띠 정보가 올바르지 않습니다.", 400);

  try {
    await createSaveMyBeltUseCase(session.accessToken).execute(belt);

    return NextResponse.json<ApiSuccessResponse<{ belt: Belt }>>({
      success: true,
      data: { belt },
    });
  } catch (error) {
    return toErrorResponse(error, "belt-save", "띠 정보를 저장하지 못했습니다.");
  }
}
