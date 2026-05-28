"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { t } from "@/lib/i18n";

interface AWCSuggestion {
  rrs_code_11d: string;
  name: string;
  distance_m: number;
}

type Step = "gps" | "awc" | "category" | "photo" | "submitting" | "done";

interface SubmitResult {
  cdpo_name?: string;
  mla_name?: string;
  contractor_name?: string;
  report_id: string;
}

export default function ReportPage() {
  const [step, setStep] = useState<Step>("gps");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [awcs, setAwcs] = useState<AWCSuggestion[]>([]);
  const [selectedAwc, setSelectedAwc] = useState<AWCSuggestion | null>(null);
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureGps = useCallback(() => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        const res = await fetch(`/api/awc/search?lat=${c.lat}&lng=${c.lng}`);
        const data = (await res.json()) as { awcs: AWCSuggestion[] };
        setAwcs(data.awcs);
        setStep("awc");
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const submit = useCallback(async () => {
    if (!selectedAwc || !category || !photo) return;
    setStep("submitting");
    setError(null);

    const form = new FormData();
    form.set("awc_code", selectedAwc.rrs_code_11d);
    form.set("category", category);
    form.set("photo", photo);
    if (coords) {
      form.set("lat", String(coords.lat));
      form.set("lng", String(coords.lng));
    }

    try {
      const res = await fetch("/api/report", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Submission failed");
      }
      const data = (await res.json()) as SubmitResult;
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStep("photo");
    }
  }, [selectedAwc, category, photo, coords]);

  if (step === "done" && result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-semibold">{t("submittedTitle", "kn")}</h1>
        <p className="text-zinc-700">
          {t("submittedBody", "kn", {
            cdpo: result.cdpo_name ?? "—",
            mla: result.mla_name ?? "—",
          })}
        </p>
        {result.contractor_name ? (
          <p className="text-sm text-zinc-500">
            Contractor: <span className="font-medium">{result.contractor_name}</span>
          </p>
        ) : null}
        <Link
          href="/"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white"
        >
          Done
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">{t("reportCta", "kn")}</h1>
        <p className="text-sm text-zinc-500">{t("reportCta", "en")}</p>
      </header>

      <ProgressBar step={step} />

      {step === "gps" && (
        <section className="space-y-4 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-medium">{t("findCentre", "kn")}</h2>
          <button
            onClick={captureGps}
            className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-lg font-medium text-white"
          >
            📍 {t("useMyLocation", "kn")}
          </button>
          {gpsError && <p className="text-sm text-red-600">{gpsError}</p>}
        </section>
      )}

      {step === "awc" && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">{t("findCentre", "kn")}</h2>
          {awcs.length === 0 && (
            <p className="text-sm text-zinc-500">
              No anganwadis found within 2 km. Crowd-correction queue will pick this up.
            </p>
          )}
          {awcs.map((a) => (
            <button
              key={a.rrs_code_11d}
              onClick={() => {
                setSelectedAwc(a);
                setStep("category");
              }}
              className="w-full rounded-xl border border-zinc-200 p-4 text-left hover:border-emerald-500"
            >
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-zinc-500">
                {a.rrs_code_11d} · {Math.round(a.distance_m)} m away
              </div>
            </button>
          ))}
        </section>
      )}

      {step === "category" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t("pickCategory", "kn")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  setCategory(c.slug);
                  setStep("photo");
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 p-4 hover:border-emerald-500"
              >
                <div className="text-4xl">{c.emoji}</div>
                <div className="text-sm font-medium">{c.labelKn}</div>
                <div className="text-xs text-zinc-500">{c.labelEn}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "photo" && (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">{t("takePhoto", "kn")}</h2>
          <p className="text-xs text-amber-700">⚠️ {t("noFaces", "kn")}</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-zinc-300 p-3"
          />
          {photo && (
            <p className="text-xs text-zinc-500">
              {photo.name} · {Math.round(photo.size / 1024)} KB
            </p>
          )}
          <button
            disabled={!photo}
            onClick={submit}
            className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-lg font-medium text-white disabled:bg-zinc-300"
          >
            {t("submit", "kn")}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      )}

      {step === "submitting" && (
        <section className="rounded-2xl border border-zinc-200 p-6 text-center">
          <p>{t("submitting", "kn")}</p>
        </section>
      )}
    </main>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const order: Step[] = ["gps", "awc", "category", "photo", "submitting", "done"];
  const idx = order.indexOf(step);
  const pct = Math.max(0, Math.min(100, ((idx + 1) / 4) * 100));
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full bg-emerald-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
