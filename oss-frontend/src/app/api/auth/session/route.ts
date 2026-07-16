import { NextRequest, NextResponse } from "next/server";

import type { SessionState } from "@/features/auth/domain/session";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "@/shared/lib/auth";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

/**
 * 세션 BFF.
 *
 * - POST   : 네이티브가 전달한 accessToken을 httpOnly 쿠키로 발급(로그인 동기화)
 * - GET    : 토큰 보유 여부 = 로그인 여부 반환
 * - DELETE : 세션 쿠키 제거(로그아웃)
 *
 * BFF는 토큰을 검증하지 않는다. 인증은 네이티브가 끝낸 상태이고, 토큰 유효성은
 * 보호된 업스트림 호출에서 백엔드가 매 요청 검증한다(trusted-on-receipt, validated-on-use).
 */

function ok(state: SessionState) {
  return NextResponse.json<ApiSuccessResponse<SessionState>>(
    { success: true, data: state },
    { status: 200 },
  );
}

export async function POST(request: NextRequest) {
  let accessToken = "";

  try {
    const body = await request.json();
    accessToken = String(body?.accessToken ?? "").trim();
  } catch {
    // 본문 파싱 실패는 아래 빈 토큰 검증에서 400으로 처리된다.
  }

  if (!accessToken) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: "`accessToken` is required.",
        statusCode: 400,
      },
      { status: 400 },
    );
  }

  // 쿠키 수명은 기본값(SESSION_COOKIE_MAX_AGE_SECONDS). 토큰 만료는 업스트림이 매 요청 검증한다.
  await writeSessionToken(accessToken);

  return ok({ authenticated: true });
}

export async function GET() {
  const token = await readSessionToken();

  return ok({ authenticated: token !== null });
}

export async function DELETE() {
  await clearSessionToken();

  return ok({ authenticated: false });
}
