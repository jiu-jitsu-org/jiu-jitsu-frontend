import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getCompetitionListPageData } from "@/features/competition/application/get-competition-list-page-data";
import { isCompetitionPageEnabled } from "@/features/competition/application/is-competition-page-enabled";
import { CompetitionListPage } from "@/features/competition/presentation/competition-list-page";
import { readServerNow } from "@/shared/lib/time";

export const metadata: Metadata = {
  title: "대회",
};

export default async function CompetitionRoutePage() {
  // 요청마다 "오늘"을 다시 정한다 — 빌드 때 그려 두면 지난 대회가 계속 남는다.
  await connection();
  if (!isCompetitionPageEnabled()) notFound();

  const data = await getCompetitionListPageData(readServerNow());
  return <CompetitionListPage data={data} />;
}
