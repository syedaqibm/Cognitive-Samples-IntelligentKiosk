# Neighborhood Home-Grown Marketplace

A simple marketplace for neighbors to sell home-grown plants, fruits, vegetables, seeds, and cuttings to each other, with **QR code + PIN** pickup verification.

- **No AI**, no plant/image recognition.
- **No real payments** — price is recorded for display only.
- **Local-only** development stack: SQLite + Next.js API + React Native (Expo).

## Repo layout

```
neighborhood-app/
├── packages/
│   └── shared/        Zod schemas + TS types shared between API and mobile
└── apps/
    ├── api/           Next.js 14 (App Router) + Prisma + SQLite
    └── mobile/        Expo (React Native + TypeScript)
```

## Prerequisites

- Node.js 22 (`.nvmrc`)
- npm 10+
- Expo Go app on your phone (iOS or Android) for testing the mobile app
- Phone and dev machine on the same Wi-Fi network

## First-time setup

```bash
cd neighborhood-app
npm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
npm run build:shared
npm run db:setup
```

Edit `apps/mobile/.env` to point `EXPO_PUBLIC_API_BASE_URL` at your dev machine's LAN IP (e.g. `http://192.168.1.42:3000`). On macOS/Linux: `ipconfig getifaddr en0` or `hostname -I | awk '{print $1}'`. Localhost will **not** work from a phone running Expo Go.

## Run everything

```bash
npm run dev
```

This runs the API (`http://localhost:3000`) and Expo dev server in parallel. Scan the Expo QR code with the Expo Go app.

## End-to-end demo flow

1. On the phone, **sign up as Alice** (e.g. `alice@example.com`).
2. **My Listings** tab → **+ New listing** → "Heirloom tomatoes", Vegetable, $3.00/lb, qty 5 — take a photo.
3. **Profile** tab → Log out → **sign up as Bob**.
4. **Browse** tab → tap Alice's tomatoes → **Order 2 lb**. The confirmation shows the order's QR token and 4-digit PIN.
5. **My Orders** shows the pending order. Note the token + PIN.
6. Log out → log in as Alice → **Pickups** tab → tap the order → see the QR code + PIN.
7. Log out → log in as Bob → **My Orders** → tap order → tap **Confirm pickup**.
   - Either point the camera at Alice's QR (second device or printout), **or** paste the token into the textbox.
   - Enter the PIN → **Confirm**.
8. The order flips to **Completed**; Alice's listing quantity drops 5 → 3.

## Useful scripts

```bash
npm run dev:api          # API only
npm run dev:mobile       # Expo only
npm run db:setup         # generate + migrate + seed
```

From `apps/api/`:

```bash
npx prisma studio        # browse the SQLite database
npx prisma migrate reset # wipe and re-seed
```

## License

MIT
