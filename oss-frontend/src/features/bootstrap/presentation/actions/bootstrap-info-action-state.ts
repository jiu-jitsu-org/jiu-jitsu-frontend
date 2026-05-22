import type { BootstrapInfoResponse } from "@/features/bootstrap/domain/bootstrap-info";

/**
 * Client-facing state returned by the bootstrap Server Action.
 *
 * This type belongs to the presentation adapter layer because it is shaped for
 * `useActionState`, not for the upstream REST contract. The domain response is
 * still preserved inside `data` so the UI can render the exact API payload.
 */
export type BootstrapInfoActionState = {
  osName: string;
  data?: BootstrapInfoResponse;
  error?: string;
  errorDetails?: unknown;
  requestedAt?: string;
};
