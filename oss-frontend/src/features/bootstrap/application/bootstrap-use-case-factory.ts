import { GetBootstrapInfoUseCase } from "@/features/bootstrap/application/get-bootstrap-info";
import { ExternalBootstrapRepository } from "@/features/bootstrap/infrastructure/external-bootstrap-repository";
import { createServerHttpClient } from "@/shared/lib/http/create-server-http-client";

/**
 * Bootstrap feature composition root.
 *
 * The app layer should stay focused on framework entry concerns such as:
 * - reading route/search params
 * - returning a React tree or HTTP response
 * - applying route-level status and cache behavior
 *
 * This factory keeps concrete infrastructure wiring inside the feature so that
 * Server Components and Route Handlers can share the same application use case.
 */
export function createGetBootstrapInfoUseCase(): GetBootstrapInfoUseCase {
  const httpClient = createServerHttpClient();
  const bootstrapRepository = new ExternalBootstrapRepository(httpClient);

  return new GetBootstrapInfoUseCase(bootstrapRepository);
}
