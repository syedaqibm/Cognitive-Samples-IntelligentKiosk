import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getServiceClient } from "@/lib/supabase";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function AWCPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = getServiceClient();

  const awc = supabase
    ? (await supabase.from("awc").select("*").eq("rrs_code_11d", code).maybeSingle()).data
    : null;

  const score = supabase
    ? (await supabase.from("awc_score").select("*").eq("awc_code", code).maybeSingle()).data
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
        ← Home
      </Link>

      <header className="mt-6">
        <p className="font-mono text-xs text-zinc-500">AWC {code}</p>
        <h1 className="mt-1 text-3xl font-semibold">
          {awc?.name ?? "Anganwadi Centre"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Block: <span className="font-medium">{awc?.block_id ?? "—"}</span> &middot;
          District: <span className="font-medium">{awc?.district_id ?? "—"}</span>
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium">This term</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Aggregate counts by category. Individual submissions are never shown
          publicly — protects submitters and prevents one bad day from
          permanently smearing a centre.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => {
            const days = (score?.open_days_by_category as Record<string, number> | null)?.[c.slug] ?? 0;
            return (
              <li
                key={c.slug}
                className="flex flex-col items-center rounded-xl border border-zinc-200 p-3 text-center"
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="mt-1 text-xs">{c.labelEn}</span>
                <span className="mt-1 text-lg font-semibold">{days}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium">Accountability chain</h2>
        <p className="mt-2 text-xs text-amber-700">
          The Anganwadi Worker is never named on this page. Pressure routes to
          CDPO + supplementary-nutrition contractor + MLA.
        </p>
        {/* TODO: hydrate CDPO, DPO, MLA, contractor from joins */}
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="CDPO (block)" value="—" />
          <Field label="DPO (district)" value="—" />
          <Field label="MLA (constituency)" value="—" />
          <Field label="Matrupoorna contractor" value="—" />
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium">Official ICDS-RRS infra (self-reported)</h2>
        <p className="mt-2 text-sm text-zinc-600">
          What the centre itself reports to the state — compare against the
          citizen view above.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Field label="Toilet" value={infraText(awc?.official_infra?.toilet)} />
          <Field label="Drinking water" value={infraText(awc?.official_infra?.drinking_water)} />
          <Field label="Electricity" value={infraText(awc?.official_infra?.electricity)} />
          <Field label="Kitchen" value={infraText(awc?.official_infra?.kitchen)} />
        </dl>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function infraText(v: boolean | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}
