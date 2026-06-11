import { NextRequest, NextResponse } from "next/server";

import {
  jsonError,
  requireSessionOr401,
  toErrorResponse,
} from "@/app/api/community/_lib/community-route-helpers";
import { createCreatePostUseCase } from "@/features/community/application/community-use-case-factory";
import type { ApiSuccessResponse } from "@/shared/types/api";

/**
 * POST /api/community/board — 게시글 생성(④, 인증 필요).
 *
 * body: { categoryId: number, title: string, body: string, imageFileIdList: number[] }
 * imageFileIdList는 등록(③) 단계에서 받은 TEMP 이미지의 서버 int id 목록(표시 순서 = 저장 순서).
 */
export async function POST(request: NextRequest) {
  const session = await requireSessionOr401();
  if ("response" in session) return session.response;

  let categoryId = NaN;
  let title = "";
  let body = "";
  let imageFileIdList: number[] = [];
  try {
    const json = await request.json();
    categoryId = Number(json?.categoryId);
    title = String(json?.title ?? "").trim();
    body = String(json?.body ?? "").trim();
    // 정수 id만 통과(잘못된 항목은 제거). 미첨부면 빈 배열.
    imageFileIdList = Array.isArray(json?.imageFileIdList)
      ? json.imageFileIdList.map(Number).filter(Number.isInteger)
      : [];
  } catch {
    // 파싱 실패는 아래 검증에서 400으로 처리된다.
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return jsonError("유효한 카테고리를 선택해 주세요.", 400);
  }
  if (!title || !body) {
    return jsonError("제목과 내용을 모두 입력해 주세요.", 400);
  }

  try {
    const data = await createCreatePostUseCase(session.accessToken).execute({
      categoryId,
      title,
      body,
      imageFileIdList,
    });

    // 201 = 생성 성공(표준). 생성된 게시글 id를 남겨 추가 여부를 서버 로그로 확인.
    console.info("[community:post-create] 생성 성공 id:", data?.id, data);

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, "post-create", "게시글 작성에 실패했습니다.");
  }
}
