import { createGetBootstrapInfoUseCase } from "@/features/bootstrap/application/bootstrap-use-case-factory";
import type { BootstrapInfoResponse } from "@/features/bootstrap/domain/bootstrap-info";
import { HttpError } from "@/shared/lib/http/http-error";

export type BootstrapInfoPageDataResult =
  | {
      ok: true;
      data: BootstrapInfoResponse;
    }
  | {
      ok: false;
      error: string;
      errorDetails?: unknown;
    };

/**
 * Page-level query for the version info Server Component.
 *
 * This function intentionally calls the application use case directly instead
 * of making an HTTP request back into our own Route Handler. Server Components
 * already run on the server, so this avoids an internal network roundtrip while
 * still preserving the same clean flow:
 *
 * Server Component -> Application -> Domain contract -> Infrastructure -> HTTP
 */
export async function getBootstrapInfoPageData(
  osName: string,
): Promise<BootstrapInfoPageDataResult> {
  try {
    const useCase = createGetBootstrapInfoUseCase();
    const data = await useCase.execute({ osName });

    return {
      ok: true,
      data,
    };
  } catch (error) {
    /**
     * The shared HTTP client normalizes upstream failures into HttpError.
     * Converting it here keeps page.tsx small and lets the presentation receive
     * a simple render-ready error state instead of transport-layer objects.
     */
    if (error instanceof HttpError) {
      return {
        ok: false,
        error: error.message,
        errorDetails: error.body,
      };
    }

    return {
      ok: false,
      error: "Unexpected server error occurred while loading bootstrap info.",
    };
  }
}
