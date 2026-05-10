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

export type BootstrapAppVersionInfo = {
  minVersion: string;
  nowVersion: string;
  needForceUpdate: boolean;
};

export type BootstrapInfoPayload = {
  appVersionInfo: BootstrapAppVersionInfo;
  test?: string;
  [key: string]: unknown;
};

/**
 * Upstream bootstrap response currently contains a standard wrapper:
 * - `success`, `code`, `message`
 * - nested `data` payload with version information
 *
 * Keeping this type explicit gives the presentation layer a stable contract.
 */
export type BootstrapInfoResponse = {
  success: boolean;
  code: string;
  message: string;
  data: BootstrapInfoPayload;
};
