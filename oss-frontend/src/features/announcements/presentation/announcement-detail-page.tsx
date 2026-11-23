import Link from "next/link";

import { AnnouncementBody } from "@/features/announcements/presentation/announcement-body";
import {
  formatAnnouncementDate,
  type AnnouncementDetail,
} from "@/features/announcements/domain/announcement";

/**
 * 공지 상세 (#509) — 약관 문서(`PolicyDocument`)와 같은 모양.
 *
 * 앱의 약관 웹뷰에는 뒤로 버튼 · 쓸어서 뒤로가 없어서(jiu-jitsu-ios `TermsWebViewView`) 위에 "공지 목록" 링크를 둔다.
 */
export function AnnouncementDetailPage({
  announcement,
}: {
  announcement: AnnouncementDetail;
}) {
  return (
    <main className="app-wide-page min-h-screen bg-white px-6 py-12 text-zinc-900">
      <article className="mx-auto w-full max-w-3xl">
        <Link
          href="/notices"
          className="text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          ← 공지 목록
        </Link>
        <header className="mt-4 border-b border-zinc-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
            {announcement.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {formatAnnouncementDate(announcement.publishedAt)}
          </p>
        </header>
        <div className="pt-6">
          <AnnouncementBody body={announcement.body} />
        </div>
      </article>
    </main>
  );
}
