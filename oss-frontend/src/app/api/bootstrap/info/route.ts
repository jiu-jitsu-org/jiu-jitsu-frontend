import { NextRequest, NextResponse } from "next/server";

import { createGetBootstrapInfoUseCase } from "@/features/bootstrap/application/bootstrap-use-case-factory";
import { HttpError, clientErrorDetails } from "@/shared/lib/http";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

/**
 * GET /api/bootstrap/info?osName=ANDROID
 *
 * This route acts as a BFF layer:
 * - validates frontend input
 * - hides upstream base URL from the browser
 * - standardizes error responses
 * - gives us a single place to add auth, logging, or response mapping later
 */
export async function GET(request: NextRequest) {
  const osName = request.nextUrl.searchParams.get("osName")?.trim();

  if (!osName) {
    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: "Query parameter `osName` is required.",
        statusCode: 400,
      },
      { status: 400 },
    );
  }

  try {
    /**
     * Keep this endpoint as the JSON-facing BFF contract for browsers or other
     * HTTP clients, while sharing the same use case as server-rendered pages.
     */
    const useCase = createGetBootstrapInfoUseCase();
    const data = await useCase.execute({ osName });

    return NextResponse.json<ApiSuccessResponse<typeof data>>(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      // 5xx는 원본 오류(연결 원인 등)를 응답에 싣지 않고 로그에만 남긴다(#512).
      if (error.status >= 500) {
        console.error("[bootstrap] upstream call failed:", error.status, error.url, error.message);
      }
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          message:
            error.status >= 500
              ? "Upstream server error occurred while loading bootstrap info."
              : error.message,
          statusCode: error.status,
          details: clientErrorDetails(error),
        },
        { status: error.status },
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        message: "Unexpected server error occurred while loading bootstrap info.",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
