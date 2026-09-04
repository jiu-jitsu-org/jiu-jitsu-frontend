import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import { getBalanceDetailPageData } from "@/features/community/application/get-balance-detail-page-data";
import type { CommentSort } from "@/features/community/domain/post";
import { BalanceDetailGone } from "@/features/community/presentation/balance/balance-detail-gone";
import { BalanceDetailView } from "@/features/community/presentation/balance/balance-detail-view";

/**
 * 밸런스 게임 상세 화면 루트 (서버 컴포넌트).
 *
 * 게시글 상세(PostDetailScreen)와 같은 구조 — application use case를 서버에서 직접 호출해
 * 게임+댓글을 가져온 뒤 순수 표현 컴포넌트에 넘기고, 실패는 진입 차단/에러 화면으로 분기한다.
 *
 * 리스트와 실패 처리가 정반대인 것에 주의: 리스트는 조회에 실패하면 카드를 조용히 감추지만,
 * 상세는 사용자가 의도적으로 들어온 화면이라 빈 화면을 보여줄 수 없다.
 */
export async function BalanceDetailScreen({
  contentId,
  sort,
}: {
  contentId: number;
  sort: CommentSort;
}) {
  const result = await getBalanceDetailPageData(contentId, sort);

  if (!result.ok) {
    // 만료 토큰 → 클라이언트가 네이티브 갱신 후 이 화면을 재실행(router.refresh)해 복구.
    if (result.reason === "session-expired") {
      return (
        <SessionExpiredRecovery
          loading={<BalanceDetailLoading />}
          fallback={<BalanceDetailError message="다시 로그인해 주세요." />}
        />
      );
    }

    // 없는 판(또는 404) → 화면을 닫고 돌아간 곳에서 안내한다.
    if (result.reason === "not-found" || result.status === 404) {
      return <BalanceDetailGone />;
    }

    return <BalanceDetailError message={result.error} />;
  }

  const { game, comments } = result.data;

  return <BalanceDetailView game={game} comments={comments} sort={sort} />;
}

/** 상세 복구(세션 갱신) 중 표시. */
function BalanceDetailLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span
        className="size-6 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label="불러오는 중"
      />
    </div>
  );
}

function BalanceDetailError({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-body-m text-text-primary">
        밸런스 게임을 불러오지 못했습니다.
      </p>
      <p className="text-body-s text-text-tertiary">{message}</p>
    </div>
  );
}
