import { createGetCurrentBalanceGameUseCase } from "@/features/community/application/community-use-case-factory";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { readSessionToken } from "@/shared/lib/auth";
import { toApiError } from "@/shared/lib/http";

/**
 * 메인 피드 Server Component용 밸런스 게임 쿼리.
 *
 * 다른 page data 쿼리(get-board-list-page-data 등)와 달리 성공/실패 result 타입을 두지 않고
 * `BalanceGame | null` 하나만 돌려준다. 밸런스 게임은 **실패해도 보여줄 화면이 없기 때문**이다:
 * 정책상 조회 실패·네트워크 오류는 에러 UI 없이 카드를 감추고, 피드는 정상 렌더한다.
 * 호출부가 분기할 것이 "카드를 그린다/안 그린다" 뿐이라 null 하나로 충분하다.
 *
 * 세션 만료(A0003)도 여기서는 null로 흡수한다. 같은 화면의 피드 조회가 이미 session-expired를
 * 감지해 클라이언트 복구(SessionExpiredRecovery)로 넘기므로, 밸런스 게임이 복구를 중복해서
 * 요구할 이유가 없다. 복구 후 SSR이 다시 돌면 이 쿼리도 인증 상태로 함께 다시 실행된다.
 *
 * 진행 중인 게임이 없을 때(업스트림 data: null)도 null이다 — 실패와 같은 화면(미노출)이라
 * 호출부에서 구분할 필요가 없다.
 */
export async function getBalanceGamePageData(): Promise<BalanceGame | null> {
  const accessToken = await readSessionToken();

  try {
    return await createGetCurrentBalanceGameUseCase(accessToken).execute();
  } catch (error) {
    const apiError = toApiError(error);

    // 화면에는 아무것도 남지 않으므로(조용히 미노출) 원인은 서버 로그로만 남긴다.
    // 조용히 삼키면 카드가 안 보이는 이유를 추적할 수 없다.
    console.error(
      "[community:balance-game-page] 오늘의 밸런스 게임 조회 실패:",
      apiError.status,
      apiError.code,
      apiError.message,
    );

    return null;
  }
}
