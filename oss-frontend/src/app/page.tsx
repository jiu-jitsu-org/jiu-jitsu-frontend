import Link from "next/link";

/**
 * 메인 화면(임시): 개발용 진입 허브.
 *
 * 작업 중인 페이지로 빠르게 이동하기 위한 링크 모음이다.
 * page는 서버 컴포넌트로 유지한다(정적 링크만 포함).
 * 원래 랜딩은 `src/app/_backup/home-page-original.tsx`에 보관돼 있다.
 */

type NavEntry = {
  href: string;
  title: string;
  description: string;
};

const NAV_ENTRIES: NavEntry[] = [
  {
    href: "/auth-playground",
    title: "인증·브릿지 테스트 하니스",
    description:
      "네이티브 없이 브릿지·세션 흐름을 확인하는 개발용 하니스 (로그인/시뮬레이터/이벤트 로그)",
  },
  {
    href: "/community-playground",
    title: "커뮤니티 메인 카드 컴포넌트",
    description:
      "커뮤니티 피드 공통 UI(FeedCard) 쇼케이스 — 실제 메인처럼 카드를 세로로 나열",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Dev Hub
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            개발용 진입 허브
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            작업 중인 페이지로 이동합니다.
          </p>
        </header>

        <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          {NAV_ENTRIES.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-zinc-900 group-hover:text-zinc-950">
                    {entry.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {entry.description}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
