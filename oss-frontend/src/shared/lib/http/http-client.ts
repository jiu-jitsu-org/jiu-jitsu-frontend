import {
  logHttpFailure,
  logHttpRequest,
  logHttpResponse,
  nextRequestSeq,
} from "./http-debug-log";
import { HttpError } from "./http-error";

type PrimitiveQueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, PrimitiveQueryValue>;

type RequestOptions = {
  path: string;
  query?: QueryParams;
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  /** 있으면 JSON 직렬화해 요청 본문으로 전송(GET은 보통 생략). */
  body?: unknown;
};

type HttpClientConfig = {
  baseUrl: string;
  timeoutMs: number;
  defaultHeaders?: HeadersInit;
  /** (dev 전용) 요청/응답을 서버 터미널에 로깅한다. config/env.ts에서 이중 게이트로 결정. */
  debugLog?: boolean;
};

/** HeadersInit(record/array/Headers 무엇이든) 값을 대상 Headers에 병합한다. */
function applyHeaders(target: Headers, init?: HeadersInit): void {
  if (!init) {
    return;
  }
  new Headers(init).forEach((value, key) => target.set(key, value));
}

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

  async post<T>(options: RequestOptions): Promise<T> {
    return this.request<T>("POST", options);
  }

  async put<T>(options: RequestOptions): Promise<T> {
    return this.request<T>("PUT", options);
  }

  async delete<T>(options: RequestOptions): Promise<T> {
    return this.request<T>("DELETE", options);
  }

  private async request<T>(
    method: string,
    { path, query, headers, cache = "no-store", next, body }: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    // body가 있을 때만 직렬화 + Content-Type 부착 → 기존 GET 호출 동작은 그대로 유지된다.
    const hasBody = body !== undefined;

    // 실제 전송 헤더를 Headers로 합쳐 fetch와 디버그 로그가 같은 값을 보게 한다.
    const requestHeaders = new Headers({ Accept: "application/json" });
    if (hasBody) {
      requestHeaders.set("Content-Type", "application/json");
    }
    applyHeaders(requestHeaders, this.config.defaultHeaders);
    applyHeaders(requestHeaders, headers);

    const debug = this.config.debugLog === true;
    const seq = debug ? nextRequestSeq() : 0;
    const startedAt = debug ? Date.now() : 0;

    if (debug) {
      logHttpRequest({ seq, method, url, headers: requestHeaders, hasBody, body });
    }

    try {
      const response = await fetch(url, {
        method,
        cache,
        next,
        signal: controller.signal,
        headers: requestHeaders,
        ...(hasBody ? { body: JSON.stringify(body) } : {}),
      });

      const responseBody = await this.parseResponseBody(response);

      if (debug) {
        logHttpResponse({
          seq,
          method,
          url,
          status: response.status,
          ok: response.ok,
          elapsedMs: Date.now() - startedAt,
          body: responseBody,
        });
      }

      if (!response.ok) {
        throw new HttpError(
          `Upstream API request failed with status ${response.status}.`,
          response.status,
          url,
          responseBody,
        );
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof HttpError) {
        // non-ok 응답은 위에서 이미 로깅됨 → 여기서는 재로깅하지 않는다.
        throw error;
      }

      if (debug) {
        const reason =
          error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        logHttpFailure({ seq, method, url, elapsedMs: Date.now() - startedAt, reason });
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
