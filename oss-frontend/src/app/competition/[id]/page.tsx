import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { SessionHintProvider } from "@/features/auth/presentation/session-hint";
import { RefreshOnLogin } from "@/features/auth/presentation/refresh-on-login";
import { getCompetitionDetailPageData } from "@/features/competition/application/get-competition-detail-page-data";
import { isCompetitionEnabled } from "@/features/competition/application/is-competition-enabled";
import { parseCompetitionId } from "@/features/competition/domain/competition";
import { competitionShareSummary } from "@/features/competition/presentation/competition-share-summary";
import { CompetitionDetailPage } from "@/features/competition/presentation/competition-detail-page";
import { readSessionToken } from "@/shared/lib/auth";
import { getRequestOrigin } from "@/shared/lib/request-origin";
import { buildShareMetadata } from "@/shared/lib/site-metadata";
import { readServerNow } from "@/shared/lib/time";
import { ServerClockProvider } from "@/shared/ui/server-clock";

type CompetitionPageParams = Promise<{ id: string }>;

/**
 * 공유 미리보기(카카오톡 등, #369) — 대회 이름 · 날짜 · 장소 · 관심 수. 이미지는 OSS 기본 카드.
 * 상세 조회는 조회수를 올리지 않는다 — 조회수는 사람이 화면을 연 뒤 화면이 센다(#420).
 */
export async function generateMetadata({
  params,
}: {
  params: CompetitionPageParams;
}): Promise<Metadata> {
  if (!isCompetitionEnabled()) return {};
  // Next가 params를 이미 풀어 넘긴다 — 한 번 더 풀면 "%" 같은 주소에서 오류가 난다.
  const competitionId = parseCompetitionId((await params).id);
  if (competitionId === null) return { title: "대회" };
  const [data, origin] = await Promise.all([
    getCompetitionDetailPageData({ competitionId, forPreview: true }),
    getRequestOrigin(),
  ]);
  if (!data.ok) return { title: "대회" };

  return {
    title: data.competition.name,
    ...buildShareMetadata({
      metadataBase: origin,
      title: data.competition.name,
      description: competitionShareSummary(data),
    }),
  };
}

/** 대회 상세 라우트 (#361, 얇은 엔트리). 데이터는 application page data가, 화면은 feature가 그린다. */
export default async function CompetitionDetailRoutePage({
  params,
}: {
  params: CompetitionPageParams;
}) {
  // 요청마다 "오늘"을 다시 정한다 — 접수 상태·남은 날이 날마다 바뀐다.
  await connection();
  if (!isCompetitionEnabled()) notFound();
  const competitionId = parseCompetitionId((await params).id);
  if (competitionId === null) notFound();

  const signedIn = (await readSessionToken()) !== null;
  const now = readServerNow();
  const data = await getCompetitionDetailPageData({ competitionId });
  if (!data.ok && data.reason === "not-found") notFound();

  return (
    // 관심 버튼이 로그인 여부로 갈린다 — 세션 판정 전에도 맞게 그리고, 로그인하면 다시 읽는다.
    <SessionHintProvider authenticated={signedIn}>
      <RefreshOnLogin />
      {/* 대회 이야기의 "2일 전"을 서버 시각 기준으로 계산한다. */}
      <ServerClockProvider serverNow={now}>
        <CompetitionDetailPage data={data} />
      </ServerClockProvider>
    </SessionHintProvider>
  );
}
