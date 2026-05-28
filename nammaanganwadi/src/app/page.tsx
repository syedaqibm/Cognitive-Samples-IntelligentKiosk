import Link from "next/link";
import { t } from "@/lib/i18n";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-20 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("appName", "kn")}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {t("appName", "en")} &middot; Karnataka
          </p>
        </div>

        <p className="max-w-md text-pretty text-base text-zinc-700 dark:text-zinc-300">
          {t("tagline", "kn")}
          <br />
          <span className="text-zinc-500 dark:text-zinc-500">{t("tagline", "en")}</span>
        </p>

        <Link
          href="/report"
          className="rounded-full bg-emerald-600 px-10 py-5 text-xl font-medium text-white shadow-lg transition hover:bg-emerald-700"
        >
          {t("reportCta", "kn")}
        </Link>

        <p className="max-w-sm text-sm text-zinc-500">
          {t("workerIsNotTheTarget", "kn")}
        </p>

        <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/leaderboard" className="underline-offset-4 hover:underline">
            {t("leaderboard", "en")}
          </Link>
          <Link href="/data" className="underline-offset-4 hover:underline">
            {t("data", "en")}
          </Link>
          <Link href="/ngo" className="underline-offset-4 hover:underline">
            {t("ngo", "en")}
          </Link>
        </nav>
      </section>

      <footer className="border-t border-zinc-200 px-6 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Open source civic accountability for Karnataka&apos;s ~66,000 anganwadi centres.
        Inspired by{" "}
        <a href="https://nammakasa.vercel.app" className="underline">
          NammaKasa
        </a>
        .
      </footer>
    </main>
  );
}
