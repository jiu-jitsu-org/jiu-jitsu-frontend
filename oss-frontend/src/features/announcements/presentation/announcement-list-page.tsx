import Link from "next/link";

import {
  formatAnnouncementDate,
  type AnnouncementPage,
} from "@/features/announcements/domain/announcement";

/**
 * 공지 목록 (#509) — 약관 · 정책 화면(`policies-index-page.tsx`)과 같은 모양.
 *
 * 앱에서는 설정 › 공지사항이 약관과 같은 웹뷰로 연다(jiu-jitsu-ios#369) — 앱 머리가 없고 나가기는 앱의 '닫기'.
 * 서버가 20개씩 준다. 다음이 있으면 "이전 공지 더 보기", 첫 페이지가 아니면 "최근 공지로".
 */
export function AnnouncementListPage({ page }: { page: AnnouncementPage }) {
  const { announcements } = page;
  return (
    <main className="app-wide-page min-h-screen bg-white px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-zinc-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            공지사항
          </h1>
        </header>

        {announcements.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">
            {page.page === 0 ? "아직 공지가 없어요" : "더 이전 공지가 없어요"}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 border-b border-zinc-200">
            {announcements.map((announcement) => (
              <li key={announcement.id}>
                <Link
                  href={`/notices/${announcement.id}`}
                  className="block py-5 transition-colors hover:bg-zinc-50 active:bg-zinc-50"
                >
                  <p className="text-base font-semibold wrap-anywhere text-zinc-900">
                    {announcement.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatAnnouncementDate(announcement.publishedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {page.hasNext || page.page > 0 ? (
          <nav className="mt-6 flex justify-between gap-4 text-sm">
            {page.page > 0 ? (
              <Link href="/notices" className="text-zinc-600 underline-offset-4 hover:underline">
                최근 공지로
              </Link>
            ) : (
              <span />
            )}
            {page.hasNext ? (
              <Link
                href={`/notices?page=${page.page + 1}`}
                className="text-zinc-600 underline-offset-4 hover:underline"
              >
                이전 공지 더 보기
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
