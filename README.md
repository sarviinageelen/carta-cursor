# Carta Fund ERP — independent local prototype

Synthetic-data Next.js application for connected fund forecasting and Fund ERP workflows. Not operated by Carta. Not production banking, tax, or compliance software.

## Requirements

- Node.js 20.9+ (developed on 22.x)
- pnpm 10

## Setup

```bash
pnpm install
pnpm db:setup
pnpm dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) and choose a seeded persona.

SQLite persists at `data/fund-erp.sqlite`. It needs a persistent Node runtime and is **not** a production serverless strategy. Do not deploy this prototype publicly as part of the original task.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm db:setup` | Migrate + seed (idempotent) |
| `pnpm db:reset -- --yes` | Delete local synthetic DB and uploads |
| `pnpm test` | Vitest domain + workflow tests |
| `pnpm test:e2e` | Playwright smoke (app must be runnable) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Production build |

## Demo

See `docs/DEMO_GUIDE.md`. Default demo clock is `2026-09-16`.

## Versions

- Next.js 16.3.5
- React 19.2.8
- Drizzle ORM 0.45.2
- better-sqlite3 13.0.3
- Tailwind CSS 4.3.3
- Vitest 5.x
- Playwright 1.63
