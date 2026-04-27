import type {
  BootstrapInfoRequest,
  BootstrapInfoResponse,
} from "@/features/bootstrap/domain/bootstrap-info";

/**
 * Domain-facing repository contract.
 *
 * Application layer depends on this interface, not on fetch or endpoint details.
 * That separation keeps orchestration logic stable if the upstream API changes.
 */
export interface BootstrapRepository {
  getBootstrapInfo(
    request: BootstrapInfoRequest,
  ): Promise<BootstrapInfoResponse>;
}
