import { getNames } from "@/lib/sheets";

// Always fetch fresh data on every request — no static generation.
export const dynamic = "force-dynamic";

export default async function Home() {
  let names: string[] = [];
  let error: string | null = null;

  try {
    names = await getNames();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black sm:p-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Uboard Dashboard
        </h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Names from the connected Google Sheet
        </p>

        {!error && names.length > 0 && (
          <p className="mb-8 text-sm text-zinc-400 dark:text-zinc-500">
            {names.length} {names.length === 1 ? "name" : "names"} total
          </p>
        )}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            <p className="mb-1 font-semibold">Error reading sheet</p>
            <p className="font-mono text-sm break-words">{error}</p>
          </div>
        ) : names.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            Sheet is connected but no data found in <code>Sheet1!A2:A</code>.
            Add some names to column A and refresh.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {names.map((name, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-3 text-zinc-900 dark:text-zinc-100"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {i + 1}
                </span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
          {names.length > 0
            ? `${names.length} ${names.length === 1 ? "name" : "names"} · reading from Sheet1!A2:A`
            : null}
        </p>
      </div>
    </main>
  );
}
