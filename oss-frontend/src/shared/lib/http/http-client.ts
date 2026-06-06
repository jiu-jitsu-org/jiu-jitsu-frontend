import { HttpError } from "./http-error";

type PrimitiveQueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, PrimitiveQueryValue>;

type RequestOptions = {
  path: string;
  query?: QueryParams;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

type HttpClientConfig = {
  baseUrl: string;
  timeoutMs: number;
  defaultHeaders?: HeadersInit;
};

/**
 * Shared HTTP client used by infrastructure repositories.
 *
 * Intent:
 * - Keep low-level fetch logic out of feature folders.
 * - Reuse timeout, URL building, and error normalization across many APIs.
 * - Make each repository focus on endpoint-specific behavior only.
 */
export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async get<T>(options: RequestOptions): Promise<T> {
    return this.request<T>("GET", options);
  }

  private async request<T>(
    method: string,
    { path, query, headers, cache = "no-store", next }: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        cache,
        next,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...this.config.defaultHeaders,
          ...headers,
        },
      });

      const body = await this.parseResponseBody(response);

      if (!response.ok) {
        throw new HttpError(
          `Upstream API request failed with status ${response.status}.`,
          response.status,
          url,
          body,
        );
      }

      return body as T;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HttpError(
          `Upstream API request timed out after ${this.config.timeoutMs}ms.`,
          504,
          url,
        );
      }

      // fetch/parse가 throw한 원본 원인(TLS/DNS/연결/헤더 등)을 노출 — 일반 500에 묻히지 않게
      const cause = error instanceof Error ? error.cause : undefined;
      console.error("[http] fetch/parse failed:", url, error, "cause:", cause);
      const reason =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);

      throw new HttpError(
        `Upstream call failed (${reason}).`,
        500,
        url,
        cause,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const normalizedBaseUrl = this.config.baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${normalizedBaseUrl}${normalizedPath}`);

    if (!query) {
      return url.toString();
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    return url.toString();
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    if (contentType.includes("text/")) {
      return response.text();
    }

    return null;
  }
}
