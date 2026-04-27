export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
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

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Implemented route</h2>
            <p className="mt-3 text-zinc-600">
              <code>/api/bootstrap/info?osName=ANDROID</code>
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              The route validates input, executes a use case, calls the upstream
              repository, and normalizes success or failure into one JSON shape.
            </p>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold">Extension points</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              Add new APIs by creating a feature under <code>src/features</code>,
              reusing the shared HTTP client, and exposing the route from{" "}
              <code>src/app/api</code>.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
