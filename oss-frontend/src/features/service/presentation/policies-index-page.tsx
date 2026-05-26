import Link from "next/link";

type PolicyLink = {
  href: string;
  title: string;
  description: string;
};

const POLICY_LINKS: PolicyLink[] = [
  {
    href: "/policies/terms-of-service",
    title: "서비스 이용약관",
    description:
      "「OSS」 서비스 이용과 관련하여 운영자와 이용자 간의 권리·의무 및 책임 사항",
  },
  {
    href: "/policies/privacy-policy",
    title: "개인정보처리방침",
    description:
      "「OSS」 서비스가 수집·이용·보관하는 개인정보의 처리 기준 및 이용자 권리",
  },
];

/**
 * Index page for the policy documents.
 *
 * Lists every policy currently published at `/policies/*` so users can
 * reach them without typing the full path. Intentionally text-only and
 * static — kept in the feature layer alongside the policy documents.
 */
export function PoliciesIndexPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl">
        <header className="border-b border-zinc-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            약관 및 정책
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            「OSS」 서비스 운영에 적용되는 약관과 정책 문서를 모아두었습니다.
          </p>
        </header>

        <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          {POLICY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-zinc-900 group-hover:text-zinc-950">
                    {link.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {link.description}
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
