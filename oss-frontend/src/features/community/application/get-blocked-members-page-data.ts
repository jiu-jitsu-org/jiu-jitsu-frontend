import { createGetBlockedMembersUseCase } from "@/features/community/application/community-use-case-factory";
import type { BlockedMember } from "@/features/community/domain/blocked-member";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

export type BlockedMembersPageDataResult =
  | { ok: true; members: BlockedMember[] }
  // 비로그인 — 앱 진입점(설정)은 로그인 상태에서만 보이고, URL 직접 진입이면 안내만 그린다.
  | { ok: false; reason: "guest" }
  // 만료 토큰 — 서버는 갱신 불가하니 클라이언트가 네이티브 갱신 후 SSR을 재실행한다.
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };

/**
 * 차단한 회원(/community/blocked-users) Server Component용 페이지 쿼리.
 *
 * 로그인 전용 API라 토큰이 없으면 호출 자체를 하지 않는다(401 확정 왕복 방지).
 * 만료 토큰(A0003) 처리는 알림함(get-inbox-page-data)과 같다.
 */
export async function getBlockedMembersPageData(): Promise<BlockedMembersPageDataResult> {
  const accessToken = await readSessionToken();
  if (!accessToken) return { ok: false, reason: "guest" };

  try {
    const members = await createGetBlockedMembersUseCase(accessToken).execute();
    return { ok: true, members };
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return { ok: false, reason: "session-expired" };
    }

    // 에러 화면으로 떨어진 실제 원인을 서버 로그에 남긴다(조용히 삼키면 디버깅이 불가능하다).
    console.error(
      "[community:blocked-members-page] 초기 조회 실패:",
      apiError.status,
      apiError.code,
      apiError.message,
    );

    return {
      ok: false,
      reason: "error",
      status: apiError.status,
      code: apiError.code,
      error: apiError.message,
    };
  }
}
