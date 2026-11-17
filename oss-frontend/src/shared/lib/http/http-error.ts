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

/**
 * 응답 `details`로 화면에 넘겨도 되는 업스트림 본문.
 *
 * 4xx는 서버가 준 오류 코드를 그대로 넘긴다 — 화면이 `details.code`로 만료 토큰 복구 · 삭제된 글 등을 가른다.
 * 5xx · 시간 초과 · 연결 실패는 넘기지 않는다 — 원본 오류(연결 원인 등)는 사용자에게 필요 없는 내부 정보라
 * 서버 로그에만 남긴다(#512).
 */
export function clientErrorDetails(error: HttpError): unknown {
  return error.status < 500 ? error.body : undefined;
}
