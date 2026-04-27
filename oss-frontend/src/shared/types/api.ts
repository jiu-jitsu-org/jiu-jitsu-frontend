/**
 * Shared API response shapes.
 *
 * `data` is intentionally generic because upstream API contracts may differ by feature.
 * Each feature can narrow the shape closer to its own domain if needed.
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  statusCode: number;
  details?: unknown;
};
