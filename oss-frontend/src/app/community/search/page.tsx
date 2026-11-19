import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import { getBoardListPageData } from "@/features/community/application/get-board-list-page-data";
import {
  normalizeSearchKeyword,
  toSearchListQuery,
} from "@/features/community/domain/post-search";
import { PostSearchScreen } from "@/features/community/presentation/search/post-search-screen";
import { AppClientHint } from "@/shared/lib/app-client/app-client-hint";
import { readSessionToken } from "@/shared/lib/auth";
import { NativePageReady } from "@/shared/lib/native-bridge";
import { readServerNow } from "@/shared/lib/time";
import { ServerClockProvider } from "@/shared/ui/server-clock";

/**
 * 커뮤니티 글 검색 라우트 (얇은 엔트리) — /community/search?q=<검색어> (#591).
 *
 * 앱은 홈 위쪽 검색 버튼을 누르면 `/community/search`를 서브뷰로 연다(jiu-jitsu-ios#435). 비로그인도 찾을 수 있다.
 * 주소에 검색어가 있으면(웹에서 결과 글을 보고 돌아온 경우 등) 첫 페이지를 서버에서 읽어 바로 그린다.
 * 못 읽으면(만료 토큰 · 오류) 화면이 브라우저에서 다시 읽는다 — 화면 조립은 PostSearchScreen(feature)에 위임한다.
 */
export default async function CommunitySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const keyword = normalizeSearchKeyword(typeof q === "string" ? q : "");
  const [result, sessionToken] = await Promise.all([
    keyword ? getBoardListPageData(toSearchListQuery(keyword)) : null,
    readSessionToken(),
  ]);

  // 카드 ⋮ · 좋아요 가드가 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리도록 힌트를 깐다(#173).
  return (
    <SessionHintProvider authenticated={sessionToken !== null}>
      <AppClientHint>
        {/* 상대 시간("5분 전")을 서버 시각 기준으로 계산하고 60초마다 갱신한다(#188). */}
        <ServerClockProvider serverNow={readServerNow()}>
          <PostSearchScreen
            serverKeyword={keyword}
            initialList={result?.ok ? result.data.list : null}
          />
          {/* 검색칸이 그려지면 앱이 로딩 덮개를 걷는다(jiu-jitsu-ios#261). */}
          <NativePageReady />
        </ServerClockProvider>
      </AppClientHint>
    </SessionHintProvider>
  );
}
