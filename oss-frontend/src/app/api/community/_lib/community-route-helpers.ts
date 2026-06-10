import { NextResponse } from "next/server";

import {
  SessionRequiredError,
  requireSessionToken,
} from "@/shared/lib/auth";
import { HttpError } from "@/shared/lib/http";
import type { ApiErrorResponse } from "@/shared/types/api";

/**
 * community BFF route 공통 헬퍼.
 *
 * 네 개의 route(상세/댓글/좋아요/북마크)가 반복하는 BFF 책임 — 경로 파라미터 검증,
 * 세션 가드, HttpError → 표준 에러 응답 변환 — 을 한곳에 모은다.
 * 비즈니스 로직이 아니라 HTTP 응답 형태(presentation) 책임이므로 app/api 아래에 둔다.
 */

export function jsonError(message: string, statusCode: number, details?: unknown) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, message, statusCode, details },
    { status: statusCode },
  );
}

/**
 * `[id]` 동적 세그먼트를 양의 정수로 파싱한다.
 * 실패하면 400 응답을 반환하므로 호출부는 `if ("response" in r) return r.response` 로 분기한다.
 */
export function parsePostId(
  raw: string,
): { postId: number } | { response: NextResponse } {
  const postId = Number(raw);
  if (!Number.isInteger(postId) || postId <= 0) {
    return { response: jsonError("잘못된 게시글 ID입니다.", 400) };
  }

  return { postId };
}

/**
 * 보호된 쓰기 진입부의 세션 가드.
 * 토큰이 있으면 반환, 없으면 401 응답을 반환한다.
 */
export async function requireSessionOr401(): Promise<
  { accessToken: string } | { response: NextResponse }
> {
  try {
    const accessToken = await requireSessionToken();
    return { accessToken };
  } catch (error) {
    if (error instanceof SessionRequiredError) {
      return { response: jsonError("로그인이 필요합니다.", 401) };
    }
    throw error;
  }
}

/**
 * 업스트림 호출 실패를 표준 에러 응답으로 변환한다.
 * - HttpError: 상태코드 그대로 전달(401/403은 재로그인 유도 메시지).
 * - 그 외(예: env 누락): 진짜 500.
 */
export function toErrorResponse(
  error: unknown,
  context: string,
  fallbackMessage: string,
): NextResponse {
  if (error instanceof HttpError) {
    console.error(
      `[community:${context}] upstream call failed:`,
      error.status,
      error.url,
      error.body,
    );

    const message =
      error.status === 401 || error.status === 403
        ? "인증에 실패했습니다. 다시 로그인해 주세요."
        : fallbackMessage;

    return jsonError(message, error.status, error.body);
  }

  console.error(`[community:${context}] unexpected (non-HTTP) error:`, error);
  return jsonError(fallbackMessage, 500);
}
