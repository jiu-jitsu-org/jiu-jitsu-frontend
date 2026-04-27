import { NextRequest, NextResponse } from "next/server";

import { GetBootstrapInfoUseCase } from "@/features/bootstrap/application/get-bootstrap-info";
import { ExternalBootstrapRepository } from "@/features/bootstrap/infrastructure/external-bootstrap-repository";
import { createServerHttpClient } from "@/shared/lib/http/create-server-http-client";
import { HttpError } from "@/shared/lib/http/http-error";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

/**
 * Build the feature dependencies close to the entry point.
 *
 * As the project grows this wiring can move to a dedicated factory or DI module,
 * but keeping it explicit here makes the flow very readable for early-stage teams.
 */
function createBootstrapInfoUseCase(): GetBootstrapInfoUseCase {
  const httpClient = createServerHttpClient();
  const bootstrapRepository = new ExternalBootstrapRepository(httpClient);

  return new GetBootstrapInfoUseCase(bootstrapRepository);
}

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
    const useCase = createBootstrapInfoUseCase();
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
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          message: error.message,
          statusCode: error.status,
          details: error.body,
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
