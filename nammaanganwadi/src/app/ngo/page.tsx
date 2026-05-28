import Link from "next/link";

export default function NGOPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">For NGO partners</h1>
      <p className="mt-3 text-zinc-700">
        We are NGO-agnostic. Any verified nutrition / women & child / child-rights
        NGO active in Karnataka can subscribe to one or more districts and receive
        real-time alerts on incoming citizen reports.
      </p>

      <section className="mt-6 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>Register below (manual verification — we check society / trust registration).</li>
          <li>Pick the districts your team can act on.</li>
          <li>Get email + Telegram alerts when new reports arrive in your zone.</li>
          <li>Mark reports as &quot;we are following up&quot; from your inbox.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium">Register interest</h2>
        <p className="mt-2 text-sm text-zinc-600">
          v1: email{" "}
          <a className="underline" href="mailto:partners@nammaanganwadi.in">
            partners@nammaanganwadi.in
          </a>{" "}
          with your registration certificate and target districts. A full self-serve
          flow ships in v1.1.
        </p>
      </section>
    </main>
  );
}
