# Namma Anganwadi · ನಮ್ಮ ಅಂಗನವಾಡಿ

Citizen accountability for Karnataka's ~66,000 anganwadi centres.
Photo + GPS + 8 vernacular icons → 90-second submission → named CDPO and MLA.
Built in the spirit of [NammaKasa](https://nammakasa.vercel.app).

## What this is

A parent, ASHA worker, or visitor can photograph a broken toilet, an empty
cooking pot, or a locked anganwadi at 11 AM, and 90 seconds later the Child
Development Project Officer's name — and the MLA's — are publicly on the hook
for *that specific 11-digit anganwadi code*.

For supply-chain categories (`no-meal`, `no-thr`), the Matrupoorna
supplementary-nutrition contractor on record for that district is *also* named
— this is the killer feature, parallel to NammaKasa's ward-MLA model.

## Design philosophy

- **The Anganwadi Worker is never named.** 87.7% of AWWs report inadequate
  honorarium; they are victims of broken supply chains, not its operators. All
  blame routes to CDPO + Matrupoorna contractor + MLA.
- **No child faces.** Server-side face detection planned for v1.1; v1 relies on
  in-camera instruction and a moderation queue.
- **Anonymous by default.** Parents never log in; only NGOs and journalists do,
  and only for `/inbox` and `/data` flows.
- **Term aggregation.** Individual reports are never publicly shown. The
  per-AWC page only shows term-level counts to protect submitters and prevent a
  single bad day from permanently smearing a centre.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript, Tailwind CSS v4
- Supabase (Postgres + PostGIS) for data and attribution lookups
- Cloudinary free tier (planned v1.1) for direct-upload photo storage
- Cloudflare Turnstile (planned) for anti-spam
- Leaflet + OpenStreetMap for maps (planned `/map` view)
- Deploys to Vercel free tier

## Local setup

```bash
# 1. Install
npm install

# 2. Set env vars
cp .env.example .env.local
# Fill in Supabase URL / keys

# 3. In your Supabase SQL editor:
#    a) run db/schema.sql once
#    b) (optional) run db/seed-karnataka.sql for sample data

# 4. Dev server
npm run dev
# open http://localhost:3000
```

Without Supabase configured, `/api/awc/search` returns a hard-coded mock so the
report flow can still be exercised end-to-end.

## Data acquisition

Karnataka master data is not yet imported. The stubs are in
`scripts/import-awc-karnataka.ts`:

- DWCD Karnataka AWC master (~66,000 rows)
- CDPO directory (~200 names)
- DPO directory (~30 names)
- Matrupoorna nutrition contractor tenders (from `eproc.karnataka.gov.in`)
- AWC → MLA constituency spatial join

Run:

```bash
npx tsx scripts/import-awc-karnataka.ts
```

Each section is documented with its source URL. Implement section by section,
idempotent.

## What's in v1 vs v1.1

| Feature                                       | v1  | v1.1 |
|-----------------------------------------------|-----|------|
| 90-second report flow                         | yes |      |
| 8 vernacular icon categories                  | yes |      |
| Kannada + English UI                          | yes |      |
| Hindi UI                                      |     | yes  |
| CDPO and MLA naming                           | yes |      |
| Matrupoorna contractor naming                 |     | yes  |
| Per-AWC term aggregate page                   | yes |      |
| CDPO and district leaderboards                | yes |      |
| Tamper-evident timestamp (OpenTimestamps)     |     | yes  |
| Cloudinary direct-upload                      |     | yes  |
| Server-side face detection                    |     | yes  |
| Auto-tweet at 30 days open                    |     | yes  |
| NGO `/inbox` (Telegram + email)               |     | yes  |
| Journalist CSV exports                        |     | yes  |

## Verification

Run the local dev server and confirm:

1. Landing page (`/`) renders in Kannada with English subtitles.
2. `/report` walks GPS → AWC pick → category → photo → submit.
3. Submission returns `cdpo_name` and `mla_name` (real values if Supabase is
   configured; placeholders otherwise).
4. `/awc/29010301001` (one of the seed AWCs) shows aggregate term counts and
   the official ICDS-RRS infra self-report side by side.
5. `/leaderboard` renders without errors even with no data.

## Roadmap

This is the first module of a planned NammaCity family of civic-accountability
apps. After v1.1 ships, NammaMara (illegal tree felling / lake encroachment
witness with tamper-evident timestamps) shares this same Next.js + Supabase
core.

## Licence

Code: MIT. Data export: CC-BY 4.0.
