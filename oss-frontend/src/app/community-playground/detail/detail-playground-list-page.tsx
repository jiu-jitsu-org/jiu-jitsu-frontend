import Link from "next/link";

/**
 * 게시글 상세 쇼케이스 타입 선택 리스트 (개발용 중간 페이지).
 *
 * 곧바로 상세가 뜨지 않고, 타입별(디폴트/사진/댓글/대댓글)로 들어가 확인할 수 있게 한다.
 * page는 서버 컴포넌트로 유지하고 정적 링크만 둔다(dev hub 패턴과 동일).
 */

type VariantEntry = {
  href: string;
  title: string;
  description: string;
  ready: boolean;
};

const VARIANTS: VariantEntry[] = [
  {
    href: "/community-playground/detail/default",
    title: "게시글 상세 (디폴트 · 타인)",
    description: "현재 연결된 레이아웃 — 타인 게시글(헤더 ⋮: 신고/숨기기)",
    ready: true,
  },
  {
    href: "/community-playground/detail/default?owner=1",
    title: "게시글 상세 (자신)",
    description: "내 게시글 — 헤더 ⋮: 삭제하기/수정하기",
    ready: true,
  },
  {
    href: "/community-playground/detail/photo",
    title: "게시글 상세 (사진)",
    description: "사진 있는 목업 (imageList 1개 이상)",
    ready: true,
  },
  {
    href: "/community-playground/detail/comments",
    title: "게시글 상세 (댓글)",
    description: "댓글 여러 개 목업 (초안)",
    ready: true,
  },
];

export function DetailPlaygroundListPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Community Detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            게시글 상세 타입 선택
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            타입별 상세 화면을 확인합니다.
          </p>
        </header>

        <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          {VARIANTS.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-zinc-900 group-hover:text-zinc-950">
                      {entry.title}
                    </p>
                    {entry.ready ? null : (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        연결 예정
                      </span>
                    )}
                  </div>
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
