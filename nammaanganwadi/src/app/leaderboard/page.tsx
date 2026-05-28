import Link from "next/link";
import { getServiceClient } from "@/lib/supabase";

interface LeaderRow {
  id: string;
  name: string;
  block_id?: string;
  district_id?: string;
  open_days_total: number;
  unresolved_count: number;
}

export const revalidate = 600;

export default async function LeaderboardPage() {
  const supabase = getServiceClient();

  const cdpos: LeaderRow[] = supabase
    ? ((await supabase.rpc("cdpo_leaderboard")).data ?? [])
    : [];

  const districts: LeaderRow[] = supabase
    ? ((await supabase.rpc("district_leaderboard")).data ?? [])
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
        ← Home
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Leaderboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Ranked by aggregate AWC-days open in the current term.
      </p>

      <Section title="CDPOs by unresolved AWC-days">
        {cdpos.length === 0 ? (
          <Empty />
        ) : (
          <Table rows={cdpos} kind="cdpo" />
        )}
      </Section>

      <Section title="Districts by % anganwadis with open issues">
        {districts.length === 0 ? (
          <Empty />
        ) : (
          <Table rows={districts} kind="district" />
        )}
      </Section>

      <p className="mt-10 text-xs text-zinc-500">
        Election freeze policy: 14 days before any state election, leaderboards
        are frozen. Submissions still flow to CDPO inboxes.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty() {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
      No data yet. Either Supabase is not configured or no reports have been filed.
    </p>
  );
}

function Table({ rows, kind }: { rows: LeaderRow[]; kind: "cdpo" | "district" }) {
  return (
    <ol className="space-y-1">
      {rows.map((r, idx) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 p-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-6 text-right font-mono text-sm text-zinc-500">
              {idx + 1}.
            </span>
            <div>
              <div className="font-medium">{r.name}</div>
              {kind === "cdpo" && r.district_id ? (
                <div className="text-xs text-zinc-500">{r.district_id}</div>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{r.open_days_total} days</div>
            <div className="text-xs text-zinc-500">{r.unresolved_count} unresolved</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
