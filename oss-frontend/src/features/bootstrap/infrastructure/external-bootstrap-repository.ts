import type {
  BootstrapInfoRequest,
  BootstrapInfoResponse,
} from "@/features/bootstrap/domain/bootstrap-info";
import type { BootstrapRepository } from "@/features/bootstrap/domain/bootstrap-repository";
import { HttpClient } from "@/shared/lib/http/http-client";

/**
 * Infrastructure implementation that knows the real upstream endpoint.
 *
 * Route handlers and use cases do not need to know:
 * - the exact REST path
 * - query string naming
 * - fetch details
 *
 * That knowledge stays here.
 */
export class ExternalBootstrapRepository implements BootstrapRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getBootstrapInfo(
    request: BootstrapInfoRequest,
  ): Promise<BootstrapInfoResponse> {
    return this.httpClient.get<BootstrapInfoResponse>({
      path: "/api/bootstrap/info",
      query: {
        osName: request.osName,
      },
    });
  }
}
