import {
  createGetBalanceGameDetailUseCase,
  createGetCommentsUseCase,
  createGetNoticeEnabledUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

export type BalanceDetailPageData = {
  game: BalanceGame;
  comments: CommentList;
  /**
   * 알림 수신 여부(앱바 종의 초기 상태).
   *
   * 게시글은 상세 응답의 noticeEnabled로 받지만 밸런스 응답에는 그 필드가 없어 따로 읽는다.
   * 비로그인은 받을 설정이 없어 false다.
   */
  noticeEnabled: boolean;
};

export type BalanceDetailPageDataResult =
  | { ok: true; data: BalanceDetailPageData }
  // 없는 판 — 화면을 닫고 돌아간 곳에서 안내한다(BalanceDetailGone).
  | { ok: false; reason: "not-found" }
  // 만료 토큰 — 서버는 갱신 불가하니 클라이언트가 네이티브 갱신 후 재조회(SSR 재실행)한다.
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };

/** 댓글 조회 실패 시 폴백 — 게임만으로도 화면이 뜨도록. */
const EMPTY_COMMENTS: CommentList = { items: [], total: 0, nextCursor: null };

/**
 * 밸런스 게임 상세 Server Component용 페이지 쿼리.
 *
 * 게시글 상세(get-post-detail-page-data)와 같은 철학 — 자체 BFF로 다시 HTTP 왕복하지 않고
 * application use case를 직접 호출한다.
 *
 * 게임과 댓글을 **병렬로** 읽는다. 게시글 상세는 순차인데, 그쪽은 게시글 작성자 id를 알아야
 * 댓글에 "작성자" 배지를 채울 수 있어서다. 밸런스 게임은 서비스가 제공하는 콘텐츠라 작성자가
 * 없고, 따라서 배지도 없어 두 조회가 서로를 기다릴 이유가 없다.
 *
 * 댓글은 게시글과 같은 업스트림(GET /community/comments?id=)을 쓴다. 파라미터 이름이 postId일
 * 뿐 실제로는 contentId라, 밸런스 게임의 contentId를 그대로 넘기면 된다.
 *
 * 알림 설정도 함께 읽는다. 이건 인증이 필요해 토큰이 있을 때만 부르고, 실패해도 화면을 막지
 * 않는다 — 종이 꺼진 채로 뜨고 탭하면 서버가 진실값으로 정정해 준다.
 */
export async function getBalanceDetailPageData(
  contentId: number,
  sort: CommentSort,
): Promise<BalanceDetailPageDataResult> {
  const accessToken = await readSessionToken();

  try {
    const [game, comments, noticeEnabled] = await Promise.all([
      createGetBalanceGameDetailUseCase(accessToken).execute(contentId),
      // 댓글이 실패해도 투표 영역은 보여야 한다(graceful degradation).
      createGetCommentsUseCase(accessToken)
        .execute(contentId, sort)
        .catch(() => EMPTY_COMMENTS),
      accessToken
        ? createGetNoticeEnabledUseCase(accessToken)
            .execute(contentId)
            .catch(() => false)
        : Promise.resolve(false),
    ]);

    if (!game) {
      return { ok: false, reason: "not-found" };
    }

    return { ok: true, data: { game, comments, noticeEnabled } };
  } catch (error) {
    const apiError = toApiError(error);

    // 로그인 상태에서 토큰 만료 → 클라이언트가 네이티브 갱신 후 SSR 재실행하도록 위임.
    if (accessToken && apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return { ok: false, reason: "session-expired" };
    }

    return {
      ok: false,
      reason: "error",
      status: apiError.status,
      code: apiError.code,
      error: apiError.message,
    };
  }
}
