/**
 * Domain objects for the bootstrap feature.
 *
 * The upstream response contract is not fully specified here yet,
 * so we model the request explicitly and keep the response flexible.
 * Once the contract stabilizes, narrow `BootstrapInfoResponse` into
 * a stricter shape instead of keeping it open-ended.
 */
export type BootstrapInfoRequest = {
  osName: string;
};

export type BootstrapInfoResponse = Record<string, unknown>;
