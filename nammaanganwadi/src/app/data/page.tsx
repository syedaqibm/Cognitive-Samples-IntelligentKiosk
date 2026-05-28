import Link from "next/link";

export default function DataPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Data for journalists & researchers</h1>
      <p className="mt-3 text-zinc-700">
        All citizen reports are released as a quarterly CSV with a permissive
        licence. Aggregated to the AWC-term level — no individual submitter data
        ever leaves this site.
      </p>
      <section className="mt-8 space-y-3">
        <DownloadStub label="Karnataka AWC scores — Q2 2026" />
        <DownloadStub label="Worst 100 anganwadis in Kalyana Karnataka" />
        <DownloadStub label="Matrupoorna contractor performance" />
      </section>
      <p className="mt-8 text-xs text-zinc-500">
        Need a custom cut for a story? Email{" "}
        <a className="underline" href="mailto:press@nammaanganwadi.in">
          press@nammaanganwadi.in
        </a>
        .
      </p>
    </main>
  );
}

function DownloadStub({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4">
      <span className="text-sm">{label}</span>
      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
        Pending v1 launch
      </span>
    </div>
  );
}
