import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createGetAnnouncementDetailUseCase } from "@/features/announcements/application/announcement-use-case-factory";
import { parseAnnouncementId } from "@/features/announcements/domain/announcement";
import { AnnouncementDetailPage } from "@/features/announcements/presentation/announcement-detail-page";

type NoticePageParams = Promise<{ id: string }>;

/** 제목(metadata)과 본문이 같은 조회를 한 번만 쓴다 */
const loadAnnouncement = cache((id: number) =>
  createGetAnnouncementDetailUseCase().execute(id),
);

export async function generateMetadata({
  params,
}: {
  params: NoticePageParams;
}): Promise<Metadata> {
  const id = parseAnnouncementId((await params).id);
  const announcement = id === null ? null : await loadAnnouncement(id);
  return { title: announcement?.title ?? "공지사항" };
}

/** 공지 상세 라우트 (#509, 얇은 엔트리). 없거나 게시 전이면 404. */
export default async function NoticeDetailRoutePage({
  params,
}: {
  params: NoticePageParams;
}) {
  const id = parseAnnouncementId((await params).id);
  if (id === null) notFound();
  const announcement = await loadAnnouncement(id);
  if (!announcement) notFound();
  return <AnnouncementDetailPage announcement={announcement} />;
}
