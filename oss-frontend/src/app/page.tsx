export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f4f4f5_0%,#fafaf9_45%,#ffffff_100%)] px-6 py-16 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10">
        <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Next.js BFF Starter
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Clean Architecture based BFF foundation
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            This app is prepared for feature-based expansion with a reusable BFF
            pipeline. The first endpoint proxies bootstrap information through
            the server instead of exposing the upstream base URL to the browser.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Implemented route</h2>
            <p className="mt-3 text-zinc-600">
              <code>/api/bootstrap/info?osName=ANDROID</code>
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              The route validates input, executes a use case, calls the upstream
              repository, and normalizes success or failure into one JSON shape.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <NavCard
                href="/version-info"
                title="VersionInfoPage"
                description="View the live bootstrap response, then reload it through a feature-owned Server Action."
              />
              <NavCard
                href="/service-info"
                title="ServiceInfoPage"
                description="Read the service introduction for Jiu-Jitsu, the community space for practitioners."
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Extension points</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              Add new APIs by creating a feature under <code>src/features</code>,
              reusing the shared HTTP client, and exposing a Route Handler only
              when a browser or external HTTP contract needs one.
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-zinc-600">
              <li>Keep page files thin and move UI into feature presentation.</li>
              <li>Let Server Components call application queries directly for initial data.</li>
              <li>Use feature presentation actions for Client Component interactions.</li>
              <li>Keep route handlers thin and move integration into use cases and repositories.</li>
              <li>Centralize environment access through <code>src/config/env.ts</code>.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}

function NavCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-6 transition hover:-translate-y-0.5 hover:bg-zinc-100"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Page
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p>
    </a>
  );
}
