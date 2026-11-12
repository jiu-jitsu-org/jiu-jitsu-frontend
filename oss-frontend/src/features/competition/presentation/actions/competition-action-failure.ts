import { CompetitionNotFoundError } from "@/features/competition/domain/competition";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

/** 대회 쓰기 Server Action이 화면에 돌려주는 실패 갈래. */
export type CompetitionActionFailureReason =
  | "unauthenticated"
  | "not-found"
  | "failed";

/**
 * 대회 쓰기 실패를 화면 갈래로 — 없거나 미공개 대회는 not-found(화면은 "더 이상 볼 수 없는 대회예요"),
 * 만료 토큰은 unauthenticated(서버는 토큰을 갱신할 수 없어 화면이 로그인 안내를 띄운다), 그 밖에는 failed.
 */
export function competitionActionFailure(
  error: unknown,
): CompetitionActionFailureReason {
  if (error instanceof CompetitionNotFoundError) return "not-found";
  if (toApiError(error).code === ApiErrorCode.EXPIRED_TOKEN) {
    return "unauthenticated";
  }
  return "failed";
}
