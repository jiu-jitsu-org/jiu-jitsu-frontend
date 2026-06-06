import { NextResponse } from "next/server";

import { createGetMyProfileUseCase } from "@/features/profile/application/profile-use-case-factory";
import {
  SessionRequiredError,
  requireSessionToken,
} from "@/shared/lib/auth";
import { HttpError } from "@/shared/lib/http";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

/**
 * GET /api/user/profile — 보호된 BFF.
 *
 * 1. 세션 쿠키의 토큰을 요구(requireSessionToken). 없으면 401.
 * 2. 토큰을 Authorization 헤더로 부착해 업스트림 GET /user/profile 호출.
 * 3. 업스트림 인증 실패(401/403 등)는 상태코드 그대로 전달 → 클라가 재로그인 유도.
 *
 * 인증 검증은 업스트림이 수행한다(validated-on-use). BFF는 토큰 부착·표준화만 담당.
 */
export async function GET() {
  // 1) 세션 가드 — 비로그인이면 401
  let accessToken: string;
  try {
    accessToken = await requireSessionToken();
  } catch (error) {
    if (error instanceof SessionRequiredError) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          message: "로그인이 필요합니다.",
          statusCode: 401,
        },
        { status: 401 },
      );
    }
    // 세션 가드 외 예외(예: 쿠키 접근 실패)도 원인이 보이게 로깅
    console.error("[profile] session gate error:", error);
    throw error;
  }

  // 2) 업스트림 호출
  try {
    const useCase = createGetMyProfileUseCase(accessToken);
    const data = await useCase.execute();

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      { success: true, data },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      // 업스트림 호출 실패: 상태코드·URL·바디를 남겨 원인 추적 가능하게
      console.error(
        "[profile] upstream call failed:",
        error.status,
        error.url,
        error.body,
      );

      // 업스트림 401/403 = 토큰 무효/만료 → 상태코드 그대로 전달
      const message =
        error.status === 401 || error.status === 403
          ? "인증에 실패했습니다. 다시 로그인해 주세요."
          : "프로필 조회에 실패했습니다.";

      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          message,
          statusCode: error.status,
          details: error.body,
        },
        { status: error.status },
      );
    }

    // HttpError가 아닌 예외(예: getServerEnv의 API_BASE_URL 누락) → 여기가 진짜 500 원인
    console.error("[profile] unexpected (non-HTTP) error:", error);

    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: "프로필 조회 중 서버 오류가 발생했습니다.",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
