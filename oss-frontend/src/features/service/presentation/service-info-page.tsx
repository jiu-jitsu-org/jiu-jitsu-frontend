/**
 * Presentation page for the service introduction.
 *
 * This page is intentionally static for now. It still lives in the feature
 * layer so future service-specific sections, cards, or supporting hooks can
 * grow without bloating the route file.
 */
export function ServiceInfoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7_0%,#fff7ed_30%,#ffffff_75%)] px-6 py-16 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(120,53,15,0.08)]">
          <div className="grid gap-10 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
                드디어 도메인 올라갔따!!!!!!! 26.05.18!!!!!!!!
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Jiu-Jitsu, a community space for people who live Jiu-Jitsu.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
                Jiu-Jitsu is a community-focused service for practitioners who
                want one place to share training stories, discover gyms, follow
                events, and grow with other people in the sport.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Badge label="Community First" />
                <Badge label="Gym & Event Discovery" />
                <Badge label="Training Stories" />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-zinc-950 p-8 text-zinc-50">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Service Summary
              </p>
              <p className="mt-5 text-2xl font-semibold leading-10">
                A focused online space where Jiu-Jitsu practitioners connect,
                share, and stay close to the community.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <HighlightCard
                  title="Connect"
                  description="Find people, gyms, and local communities worth joining."
                />
                <HighlightCard
                  title="Share"
                  description="Post experiences, insights, and useful training information."
                />
                <HighlightCard
                  title="Discover"
                  description="Track events, notices, and updates relevant to practitioners."
                />
                <HighlightCard
                  title="Grow"
                  description="Build a more informed and connected training life."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Community Posts"
            description="A space for practitioners to write training notes, match reviews, and day-to-day stories from the mat."
          />
          <FeatureCard
            title="Gym Information"
            description="A structured place to discover academy information, local recommendations, and practical visitor guidance."
          />
          <FeatureCard
            title="Event Awareness"
            description="A clean feed for seminars, competitions, announcements, and updates relevant to the Jiu-Jitsu scene."
          />
        </section>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
      {label}
    </span>
  );
}

function HighlightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-300">{description}</p>
    </article>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-zinc-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Service Feature
      </p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-4 text-base leading-8 text-zinc-600">{description}</p>
    </article>
  );
}
