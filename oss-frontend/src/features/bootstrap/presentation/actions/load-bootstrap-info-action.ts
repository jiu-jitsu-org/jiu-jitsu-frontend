"use server";

import { getBootstrapInfoPageData } from "@/features/bootstrap/application/get-bootstrap-info-page-data";
import type { BootstrapInfoActionState } from "@/features/bootstrap/presentation/actions/bootstrap-info-action-state";

/**
 * Server Action used by VersionInfoPage.
 *
 * Placement rationale:
 * - This is a Next/React adapter for a UI interaction, so it lives in
 *   `features/bootstrap/presentation/actions`.
 * - It does not call `fetch` or the upstream REST API directly.
 * - It delegates to the bootstrap application query, which then uses the
 *   repository and shared HTTP client.
 *
 * Runtime flow:
 * Client button click -> useActionState -> this Server Action
 *   -> getBootstrapInfoPageData
 *   -> GetBootstrapInfoUseCase
 *   -> ExternalBootstrapRepository
 *   -> external REST API
 *
 * Security note:
 * Server Actions are reachable as POST requests. This action only reads public
 * bootstrap metadata today, but user-specific data or mutations must add
 * authentication and authorization checks before calling the application layer.
 */
export async function loadBootstrapInfoAction(
  previousState: BootstrapInfoActionState,
  formData: FormData,
): Promise<BootstrapInfoActionState> {
  /**
   * `useActionState` passes FormData as the second parameter when the action is
   * attached to a form. The previous state is still useful as a fallback so the
   * UI does not lose the current OS value if the submitted form is malformed.
   */
  const submittedOsName = String(formData.get("osName") ?? "").trim();
  const osName = submittedOsName || previousState.osName;
  const result = await getBootstrapInfoPageData(osName);
  const requestedAt = new Date().toISOString();

  if (!result.ok) {
    return {
      osName,
      error: result.error,
      errorDetails: result.errorDetails,
      requestedAt,
    };
  }

  return {
    osName,
    data: result.data,
    requestedAt,
  };
}
