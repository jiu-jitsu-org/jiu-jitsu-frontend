import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import { getCompetitionListPageData } from "@/features/competition/application/get-competition-list-page-data";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { CompetitionListPage } from "@/features/competition/presentation/competition-list-page";
import { readSessionToken } from "@/shared/lib/auth";
import { readServerNow } from "@/shared/lib/time";
import { DevTabBar } from "@/shared/ui/dev-tab-bar";

export const metadata: Metadata = {
  title: "대회",
};

export default async function CompetitionRoutePage() {
  // 요청마다 "오늘"을 다시 정한다 — 빌드 때 그려 두면 지난 대회가 계속 남는다.
  await connection();
  if (!isCompetitionPageEnabled()) notFound();

  const signedIn = (await readSessionToken()) !== null;
  const data = await getCompetitionListPageData({
    now: readServerNow(),
    signedIn,
  });

  return (
    // 관심 필터가 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리도록 힌트를 깔고,
    // 로그인하면 관심 목록을 다시 읽도록 서버 렌더를 다시 돌린다.
    <SessionHintProvider authenticated={signedIn}>
      <RefreshOnLogin />
      <CompetitionListPage data={data} />
      {/* 테스트용 하단 탭 — 앱 밖 브라우저에서 커뮤니티로 돌아가는 임시 입구(이 화면은 개발 환경에서만 열림). */}
      <DevTabBar enabled />
    </SessionHintProvider>
  );
}
