import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readBeltAvatarSample } from "@/features/community/application/belt-avatar-sample";
import { getBalanceHomePageData } from "@/features/community/application/get-balance-game-page-data";
import { getHomeFeedPageData } from "@/features/community/application/get-home-feed-page-data";
import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import { AppClientHint } from "@/shared/lib/app-client/app-client-hint";
import { BalanceGameSection } from "@/features/community/presentation/balance/balance-game-section";
import {
  BALANCE_INTRO_COOKIE,
  readBalanceIntroForced,
  shouldPlayBalanceIntro,
} from "@/features/community/presentation/balance/balance-intro";
import {
  BALANCE_YESTERDAY_SEEN_COOKIE,
  readYesterdaySeen,
} from "@/features/community/presentation/balance/balance-yesterday";
import { FeedScrollTopOnReload } from "@/features/community/presentation/feed/feed-scroll-top-on-reload";
import { HomeOpenInAppBanner } from "@/features/community/presentation/feed/home-open-in-app-banner";
import { feedFilterKey } from "@/features/community/domain/feed-filter";
import { HomeFeed } from "@/features/community/presentation/home-feed";
import { HomeSubviewAppBar } from "@/features/community/presentation/home-subview-app-bar";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";
import { NativePageReady } from "@/shared/lib/native-bridge";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { loadCompetitionAlertSettings } from "@/features/competition/application/load-competition-alert-settings";
import { CompetitionAlertProvider } from "@/features/competition/presentation/competition-alert-provider";
import { readSessionToken } from "@/shared/lib/auth";
import { getRequestOrigin } from "@/shared/lib/request-origin";
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  buildOpenGraph,
} from "@/shared/lib/site-metadata";
import { readServerNow } from "@/shared/lib/time";
import { ServerClockProvider } from "@/shared/ui/server-clock";

/**
 * 홈 공유 미리보기(#518) — 루트 기본값에 기본 카드 이미지를 더한다.
 *
 * 루트 layout이 아니라 여기서 넣는 이유: 기본 카드는 상대 경로라 요청 origin으로 절대화해야 하는데, 루트에서
 * 요청 헤더를 읽으면 정적 페이지(정책 문서 등)까지 동적으로 바뀐다. 홈은 이미 동적이다(쿠키 · 세션).
 * origin을 모르면(host 없는 비정상 요청) 이미지 없이 둔다 — 상세의 buildShareMetadata와 같은 규칙.
 */
export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();
  if (!origin) return {};

  return {
    metadataBase: origin,
    openGraph: {
      ...buildOpenGraph({ title: SITE_NAME, description: SITE_DESCRIPTION }),
      images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
  };
}

/**
 * 메인 화면 — 커뮤니티 게시글 피드.
 *
 * 목록과 오늘의 밸런스 게임(로그인이면 대회 알림 설정까지)을 **병렬로** 조회한다. 순차로 부르면
 * 밸런스 조회만큼 첫 페인트가 늦고, 나중에 붙이면 카드가 뒤늦게 끼어들어 목록이 아래로 밀린다.
 *
 * Server Component가 초기 목록을 조회(GET /board)해 FeedCard 목록으로 렌더한다.
 * 데이터 조회는 application page data query에 위임하고(page는 라우팅/조립만),
 * 로딩은 같은 라우트의 loading.tsx, 카드 상호작용은 client 컴포넌트가 담당한다.
 * 개발용 진입 허브/playground는 `src/app/_backup/`에 보관돼 있다.
 *
 * 위 카테고리 탭(#590): `?categoryId=`면 그 카테고리 탭, `?competitionId=`면 '대회' 탭에서 그 대회 글만(#598 —
 * 대회 이야기 '모두 보기' · 앱이 넘긴 대회 번호, jiu-jitsu-ios#437). 없거나 못 여는 값이면 전체.
 * 탭을 바꾼 뒤 목록은 HomeFeed가 클라이언트에서 읽는다.
 *
 * `?view=subview`는 앱이 이 목록을 서브뷰로 쌓았다는 표시다(글 상세 카테고리 이름 · 구버전 앱의 대회 이야기 '모두 보기').
 * 서브뷰는 앱 머리 없이 화면 끝까지 그리고 문서 스크롤을 막으므로, 스크롤 셸 + 뒤로가기 앱바로 감싸고 밸런스 띠는 뺀다.
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
    categoryId?: string | string[];
    competitionId?: string | string[];
    view?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const beltSample = readBeltAvatarSample(params.belt);
  const balanceIntroForced = readBalanceIntroForced(params.intro);
  const subview = params.view === "subview";
  const now = readServerNow();
  const cookieStore = await cookies();
  const [feed, balance, sessionToken, alertSettings] =
    await Promise.all([
      getHomeFeedPageData(
        { categoryId: params.categoryId, competitionId: params.competitionId },
        beltSample,
      ),
      // 서브뷰(글 상세에서 연 카테고리 모아 보기)는 밸런스 띠를 그리지 않으니 읽지 않는다.
      // 로그인했으면 어제 투표한 판 결과(#681)도 함께 찾는다 — 이 기기에서 이미 봤으면(쿠키) 찾지 않는다.
      subview
        ? null
        : getBalanceHomePageData({
            now,
            yesterdaySeen: readYesterdaySeen(
              cookieStore.get(BALANCE_YESTERDAY_SEEN_COOKIE)?.value,
            ),
          }),
      readSessionToken(),
      // 글 속 대회 카드(#379)의 하트로 처음 관심 등록하면 마감 알림 시트를 띄운다 — 알림 설정도
      // 목록과 나란히 읽는다(#534). 따로 기다리면 로그인한 홈이 BE 왕복 한 번만큼 늦게 그려진다.
      // 비로그인이면 조회하지 않고(토큰이 없으면 null), 실패해도 null이라 홈은 그려진다.
      isCompetitionEnabled() ? loadCompetitionAlertSettings() : null,
    ]);
  const balanceGame = balance?.game ?? null;
  // 그날 게임을 처음 볼 때만 히어로 인트로를 돌린다(balance-intro의 BALANCE_INTRO_COOKIE).
  const balanceIntro =
    balanceGame !== null &&
    shouldPlayBalanceIntro({
      contentId: balanceGame.contentId,
      seenContentId: cookieStore.get(BALANCE_INTRO_COOKIE)?.value,
      forced: balanceIntroForced,
    });

  // 카테고리 탭 · 목록 · 작성 FAB. 주소의 탭이 바뀌어 서버가 다시 그리면 처음부터 다시 연다.
  const homeFeed = (
    <HomeFeed
      key={feedFilterKey(feed.filter)}
      categories={feed.categories}
      initialFilter={feed.filter}
      initialCompetition={feed.competition}
      initialResult={feed.result}
      competitionOptions={feed.competitionOptions}
      currentYear={feed.currentYear}
      subview={subview}
      // 밸런스 카드는 피드가 정상일 때만 얹는다 — 에러·복구 화면 위에 얹으면 "무엇이 실패했는지"가
      // 흐려진다. 진행 중인 판이 없거나 조회에 실패했으면(null) 아무것도 그리지 않는다. 서브뷰는 읽지 않아 늘 null.
      // 한 대회 글만 보러 들어온 화면(대회 상세 '모두 보기' · 앱이 넘긴 대회 번호)에도 두지 않는다 —
      // 그 대회 글을 보러 온 맥락이라 오늘의 게임은 군더더기다.
      balance={
        feed.result.ok && balanceGame && feed.filter.competitionId === null ? (
          <BalanceGameSection
            initialGame={balanceGame}
            initialYesterday={balance?.yesterday ?? null}
            intro={balanceIntro}
          />
        ) : null
      }
    />
  );

  return (
    // 카드 ⋮가 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리도록 힌트를 깐다(#173).
    <SessionHintProvider authenticated={sessionToken !== null}>
      <AppClientHint>
        {/* 상대 시간("5분 전")을 서버 시각 기준으로 계산하고 60초마다 갱신한다(#188). */}
        <ServerClockProvider serverNow={now}>
          <CompetitionAlertProvider settings={alertSettings} serverNow={now}>
            {subview ? (
              // 앱 서브뷰 — 문서 대신 셸이 스크롤되고(앱이 문서 스크롤을 막는다), 앱바가 상태바 자리를 비운다.
              <SubviewScrollShell className="bg-surface-container">
                <HomeSubviewAppBar />
                <NativePageReady />
                {homeFeed}
              </SubviewScrollShell>
            ) : (
              <main className="feed-bounce-scroll min-h-screen bg-surface-container">
                {/* 새로고침이면 이전 위치 대신 맨 위에서 시작한다(#260). */}
                <FeedScrollTopOnReload />
                {/* 브라우저(공유 링크로 들어온 첫 화면)면 맨 위에 '앱으로 보기' 배너(#518). 앱 웹뷰는 없음. */}
                <HomeOpenInAppBanner />
                {/* 피드가 그려지면 앱이 사진을 다 받기 전에 로딩 덮개를 걷는다(jiu-jitsu-ios#261). */}
                <NativePageReady />
                {homeFeed}
              </main>
            )}
          </CompetitionAlertProvider>
        </ServerClockProvider>
      </AppClientHint>
    </SessionHintProvider>
  );
}
