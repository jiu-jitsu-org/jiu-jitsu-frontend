import { HttpError } from "./http-error";

/**
 * 업스트림 표준 에러 봉투.
 *
 * 성공 응답은 봉투 없이 데이터가 바로 온다(예: GET /board/{id}). 반면 에러 응답은
 * `{ success:false, code, message }` 형태로 오므로, code로 케이스를 분기한다.
 */
export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
};

/**
 * 자주 쓰는 에러 코드. 여러 도메인/화면에서 분기에 재사용한다.
 * (업스트림 Swagger 기준 — 새 코드는 여기에 추가해 한곳에서 관리)
 */
export const ApiErrorCode = {
  /** 400 잘못된 요청 파라미터. */
  WRONG_PARAMETER: "R0002",
  /** 404 존재하지 않는 게시글. */
  BOARD_NOT_FOUND: "C0002",
  /** 403 만료된 액세스 토큰. 브라우저는 bffFetch가 네이티브 갱신·재시도로 처리한다. */
  EXPIRED_TOKEN: "A0003",
  /** 500 서버 오류. */
  SERVER_ERROR: "SY002",
} as const;

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    body.success === false &&
    typeof body.code === "string" &&
    typeof body.message === "string"
  );
}

/**
 * 정규화된 API 에러.
 *
 * code(분기용) + message(표시/로깅) + status를 갖는다. 호출부는 `instanceof ApiError`로 받아
 * `error.code`에 맞춰 처리한다(예: BOARD_NOT_FOUND → 404 화면).
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 임의 에러(HttpClient의 HttpError 등)를 ApiError로 변환한다.
 * 에러 봉투에 code/message가 있으면 그대로 사용하고, 없으면 서버 오류로 본다.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpError) {
    if (isApiErrorBody(error.body)) {
      return new ApiError(error.body.code, error.body.message, error.status);
    }
    return new ApiError(ApiErrorCode.SERVER_ERROR, error.message, error.status);
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ApiError(ApiErrorCode.SERVER_ERROR, message, 500);
}
