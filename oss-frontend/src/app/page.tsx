import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { readBeltAvatarSample } from "@/features/community/application/belt-avatar-sample";
import { getBalanceGamePageData } from "@/features/community/application/get-balance-game-page-data";
import { getBoardListPageData } from "@/features/community/application/get-board-list-page-data";
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";
import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import { DEFAULT_BOARD_LIST_QUERY } from "@/features/community/domain/post-summary";
import { BalanceGameSection } from "@/features/community/presentation/balance/balance-game-section";
import {
  BALANCE_INTRO_COOKIE,
  readBalanceIntroForced,
  shouldPlayBalanceIntro,
} from "@/features/community/presentation/balance/balance-intro";
import { CommunityFeedList } from "@/features/community/presentation/community-feed-list";
import { FeedEmptyState } from "@/features/community/presentation/feed-empty-state";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { FeedScrollTopOnReload } from "@/features/community/presentation/feed/feed-scroll-top-on-reload";
import { PostWriteFab } from "@/features/community/presentation/post-write-fab";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import { CompetitionAlertProvider } from "@/features/competition/presentation/competition-alert-provider";
import { readSessionToken } from "@/shared/lib/auth";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";
import { ServerClockProvider } from "@/shared/ui/server-clock";
import { Spinner } from "@/shared/ui/spinner";

/**
 * 메인 화면 — 커뮤니티 게시글 피드.
 *
 * 목록과 오늘의 밸런스 게임을 **병렬로** 조회한다. 순차로 부르면 밸런스 조회만큼 첫 페인트가
 * 늦고, 나중에 붙이면 카드가 뒤늦게 끼어들어 목록이 아래로 밀린다.
 *
 * Server Component가 초기 목록을 조회(GET /board)해 FeedCard 목록으로 렌더한다.
 * 데이터 조회는 application page data query에 위임하고(page는 라우팅/조립만),
 * 로딩은 같은 라우트의 loading.tsx, 카드 상호작용은 client 컴포넌트가 담당한다.
 * 개발용 진입 허브/playground는 `src/app/_backup/`에 보관돼 있다.
 *
 * `?belt=sample`은 `next dev` 전용 띠 아바타 예시다(production에선 무시 — belt-avatar-sample).
 * `?intro=1`은 `next dev` 전용으로, 이미 본 게임이어도 밸런스 게임 인트로를 다시 돌린다(#305 — balance-intro).
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    belt?: string | string[];
    intro?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const beltSample = readBeltAvatarSample(params.belt);
  const balanceIntroForced = readBalanceIntroForced(params.intro);
  const [result, balanceGame, sessionToken, cookieStore] = await Promise.all([
    getBoardListPageData(DEFAULT_BOARD_LIST_QUERY, beltSample),
    getBalanceGamePageData(),
    readSessionToken(),
    cookies(),
  ]);
  // 글 속 대회 카드(#379)의 하트로 처음 관심 등록하면 마감 알림 시트를 띄운다 — 알림 설정을 함께 읽는다.
  const alertSettings =
    sessionToken !== null && isCompetitionPageEnabled()
      ? await loadCompetitionAlertSettings()
      : null;
  const now = readServerNow();
  // 그날 게임을 처음 볼 때만 히어로 인트로를 돌린다(balance-intro의 BALANCE_INTRO_COOKIE).
  const balanceIntro =
    balanceGame !== null &&
    shouldPlayBalanceIntro({
      contentId: balanceGame.contentId,
      seenContentId: cookieStore.get(BALANCE_INTRO_COOKIE)?.value,
      forced: balanceIntroForced,
    });

  return (
    // 카드 ⋮가 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리도록 힌트를 깐다(#173).
    <SessionHintProvider authenticated={sessionToken !== null}>
      {/* 상대 시간("5분 전")을 서버 시각 기준으로 계산하고 60초마다 갱신한다(#188). */}
      <ServerClockProvider serverNow={now}>
        <CompetitionAlertProvider
          settings={alertSettings}
          today={toKstDateKey(now)}
        >
          <main className="feed-bounce-scroll min-h-screen bg-surface-container">
            {/* 새로고침이면 이전 위치 대신 맨 위에서 시작한다(#260). */}
            <FeedScrollTopOnReload />
            {renderFeed(result, balanceGame, balanceIntro)}

            {/* 게시글 작성 진입 FAB — 네이티브면 OPEN_SUBVIEW로 풀스크린 서브뷰, 웹 단독이면 라우터 이동. */}
            <PostWriteFab />
          </main>
        </CompetitionAlertProvider>
      </ServerClockProvider>
    </SessionHintProvider>
  );
}

/**
 * 조회 결과를 화면 상태로 매핑한다.
 * - session-expired: 서버는 토큰 갱신 불가 → 클라이언트가 네이티브 갱신 후 SSR을 재실행(복구).
 *   익명으로 격하하지 않아 네이티브 로그인 세션과 어긋나지 않는다.
 * - error: 그 외 조회 실패 → 재시도 화면.
 */
function renderFeed(
  result: Awaited<ReturnType<typeof getBoardListPageData>>,
  balanceGame: BalanceGame | null,
  balanceIntro: boolean,
): ReactNode {
  if (!result.ok) {
    if (result.reason === "session-expired") {
      return <SessionExpiredRecovery loading={<FeedLoading />} />;
    }
    return <FeedErrorState />;
  }

  // 밸런스 카드는 피드가 정상일 때만 얹는다 — 에러·복구 화면 위에 얹으면 "무엇이 실패했는지"가
  // 흐려진다. 진행 중인 판이 없거나 조회에 실패했으면(null) 아무것도 그리지 않는다.
  const balance = balanceGame ? (
    <BalanceGameSection initialGame={balanceGame} intro={balanceIntro} />
  ) : null;

  return (
    <>
      {balance}
      {result.data.list.items.length === 0 ? (
        <FeedEmptyState />
      ) : (
        <CommunityFeedList
          posts={result.data.list.items}
          page={result.data.list.page}
          isLast={result.data.list.isLast}
        />
      )}
    </>
  );
}

/** 피드 복구(세션 갱신) 중 표시. */
function FeedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}
