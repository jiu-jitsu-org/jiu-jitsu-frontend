/**
 * Normalized HTTP error for upstream calls.
 *
 * We throw this from the shared HTTP client so that route handlers can translate
 * failures into stable JSON responses for the frontend.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
