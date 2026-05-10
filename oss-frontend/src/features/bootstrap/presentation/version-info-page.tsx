import type { BootstrapInfoResponse } from "@/features/bootstrap/domain/bootstrap-info";

type VersionInfoPageProps = {
  osName: string;
  data?: BootstrapInfoResponse;
  error?: string;
  errorDetails?: unknown;
};

/**
 * Pure presentation component for the version info page.
 *
 * The route layer fetches from the BFF and passes either data or error state
 * into this component. This keeps rendering logic testable and prevents route
 * files from accumulating page markup.
 */
export function VersionInfoPage({
  osName,
  data,
  error,
  errorDetails,
}: VersionInfoPageProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f4f5_0%,#fafaf9_45%,#ffffff_100%)] px-6 py-16 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(24,24,27,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Version Info
          </p>
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight">
                Bootstrap BFF response viewer
              </h1>
              <p className="mt-4 text-lg leading-8 text-zinc-600">
                This page calls the internal BFF route and renders the upstream
                bootstrap response for <code>{osName}</code>. It is the
                reference page for future server-rendered pages that depend on
                internal REST mediation.
              </p>
            </div>
            <a
              href={`/version-info?osName=${encodeURIComponent(osName)}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Refresh Data
            </a>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">BFF Response</h2>
              <span className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                /api/bootstrap/info
              </span>
            </div>

            {error ? (
              <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
                  Request Failed
                </p>
                <p className="mt-3 text-lg font-medium text-red-950">{error}</p>
                {errorDetails ? (
                  <pre className="mt-5 overflow-x-auto rounded-2xl bg-red-100 p-4 text-sm text-red-950">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}

            {data ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="API Success" value={String(data.success)} />
                  <StatCard label="Code" value={data.code} />
                  <StatCard label="Message" value={data.message} />
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        App Version Info
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">
                        Current bootstrap metadata
                      </h3>
                    </div>
                    <ForceUpdateBadge
                      needForceUpdate={data.data.appVersionInfo.needForceUpdate}
                    />
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoItem
                      term="Minimum Version"
                      description={data.data.appVersionInfo.minVersion}
                    />
                    <InfoItem
                      term="Current Version"
                      description={data.data.appVersionInfo.nowVersion}
                    />
                    <InfoItem
                      term="Force Update"
                      description={String(data.data.appVersionInfo.needForceUpdate)}
                    />
                  </dl>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-zinc-950 p-6 text-zinc-50">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Raw JSON
                  </p>
                  <pre className="mt-4 overflow-x-auto text-sm leading-7">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </article>

          <aside className="space-y-6">
            <article className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Request Summary
              </p>
              <dl className="mt-5 space-y-4">
                <InfoItem term="Method" description="GET" />
                <InfoItem
                  term="BFF Path"
                  description={`/api/bootstrap/info?osName=${osName}`}
                />
                <InfoItem term="Rendering" description="Server page via internal BFF" />
              </dl>
            </article>

            <article className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Why this page exists
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
                <li>Shows how a React page consumes an internal BFF route.</li>
                <li>Keeps page code unaware of the upstream base URL.</li>
                <li>Acts as a visual smoke test for bootstrap integration.</li>
              </ul>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  term,
  description,
}: {
  term: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {term}
      </dt>
      <dd className="mt-3 break-all text-lg font-medium text-zinc-950">
        {description}
      </dd>
    </div>
  );
}

function ForceUpdateBadge({
  needForceUpdate,
}: {
  needForceUpdate: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
        needForceUpdate
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {needForceUpdate ? "Force Update Required" : "No Forced Update"}
    </span>
  );
}
