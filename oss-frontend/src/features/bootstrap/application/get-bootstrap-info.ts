import type { BootstrapRepository } from "@/features/bootstrap/domain/bootstrap-repository";
import type {
  BootstrapInfoRequest,
  BootstrapInfoResponse,
} from "@/features/bootstrap/domain/bootstrap-info";

/**
 * Application use case for bootstrap info.
 *
 * This layer is where feature-specific orchestration lives.
 * Today it forwards the request, but later this is the right place for:
 * - input normalization
 * - response mapping
 * - combining multiple repositories
 * - business rules that should not sit in route handlers
 */
export class GetBootstrapInfoUseCase {
  constructor(private readonly bootstrapRepository: BootstrapRepository) {}

  async execute(
    request: BootstrapInfoRequest,
  ): Promise<BootstrapInfoResponse> {
    return this.bootstrapRepository.getBootstrapInfo(request);
  }
}
