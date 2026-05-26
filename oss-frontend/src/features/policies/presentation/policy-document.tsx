/**
 * Shared building blocks for static text-only policy pages
 * (terms of service, privacy policy, marketing consent, etc.).
 *
 * Keeping these in one place avoids duplicating the same typography rules
 * across every policy document and makes the visual style consistent.
 */

export function PolicyDocument({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <article className="mx-auto w-full max-w-3xl leading-7">
        <header className="border-b border-zinc-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-sm text-zinc-600">{subtitle}</p>
          ) : null}
        </header>
        <div className="space-y-10 pt-2">{children}</div>
      </article>
    </main>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 text-sm leading-7 text-zinc-700">{children}</p>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </section>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-7 text-zinc-700">
        {children}
      </div>
    </div>
  );
}

export function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-500">
      {children}
    </ol>
  );
}

export function UnorderedList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-zinc-400">
      {children}
    </ul>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-4 rounded-lg border-l-4 border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-7 text-zinc-700">
      {children}
    </aside>
  );
}

/**
 * Simple two-or-more column table used in policy documents
 * (e.g. processing delegation list in the privacy policy).
 */
export function PolicyTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-zinc-300 bg-zinc-50 text-left">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 font-semibold text-zinc-800"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-zinc-200 align-top text-zinc-700"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 leading-6">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
