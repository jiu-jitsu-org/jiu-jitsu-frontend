import type { Metadata } from "next";

import { createGetAnnouncementListUseCase } from "@/features/announcements/application/announcement-use-case-factory";
import { parseAnnouncementPage } from "@/features/announcements/domain/announcement";
import { AnnouncementListPage } from "@/features/announcements/presentation/announcement-list-page";

export const metadata: Metadata = { title: "공지사항" };

/** 공지 목록 라우트 (#509, 얇은 엔트리). 요청마다 받는다 — 예약 공지가 정해진 시각에 보이게. */
export default async function NoticesRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const page = parseAnnouncementPage((await searchParams).page);
  const data = await createGetAnnouncementListUseCase().execute(page);
  return <AnnouncementListPage page={data} />;
}
