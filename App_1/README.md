# Spend — Expense Tracker

A Fabric-authenticated personal expense tracker built on the Rayfin platform.
Track spending by category, set monthly budgets per category, and see where the
money goes on a per-month dashboard — with per-user row-level security so each
signed-in user only sees their own data.

## Features

- **Monthly dashboard** — total spent, total budget, and remaining, with a
  month selector covering every month you have data for
- **Category breakdown** — per-category bars comparing spending against budget,
  with over-budget highlighting
- **Budgets** — set or edit a monthly limit per category inline
- **Expense log** — add and delete expenses with description, amount,
  category, and date

## Getting started

```bash
# Deploy app to Fabric and start the local dev server
npm run dev

# As needed, apply database migrations (one time, when running locally)
npm run rayfin:db
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Project structure

```text
├── rayfin/
│   ├── rayfin.yml          # Fabric service configuration
│   └── data/
│       ├── Expense.ts      # Expense entity with @role-based per-user access
│       ├── Budget.ts       # Per-category monthly budget entity
│       └── schema.ts       # Schema export consumed by the typed client
├── src/
│   ├── main.tsx            # Entry point + Rayfin client bootstrap
│   ├── App.tsx             # Routes and auth gate
│   ├── lib/
│   │   └── categories.ts   # Category palette, money/month formatting
│   ├── hooks/
│   │   └── AuthContext.tsx # React context wrapping the auth helpers
│   ├── components/
│   │   └── AuthPage.tsx    # Sign-in UI
│   ├── pages/
│   │   └── HomePage.tsx    # Dashboard: stats, category bars, expense log
│   └── services/
│       ├── IAuthService.ts        # Auth service contract + AuthUser type
│       ├── MockAuthService.ts     # Local-dev impl (email/password)
│       ├── RayfinAuthService.ts   # Production impl (Fabric brokered auth)
│       ├── rayfinClient.ts        # Typed Rayfin client singleton
│       ├── bootstrap.ts           # Reads env, picks the right auth service
│       ├── expenses.ts            # Expense CRUD (in-memory in local dev)
│       └── budgets.ts             # Budget upsert/list (in-memory in local dev)
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Deploy app to Fabric and start local dev server |
| `npm run build` | Production build |
| `npm run build:fabric` | Build for Fabric deployment (entrypoint for `rayfin up staticapp deploy`) |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run unit tests with Vitest |
| `npm run rayfin:db` | Apply database migrations |
