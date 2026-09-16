# Demo guide

Local, synthetic-data prototype. Start the app, then follow the routes below.

## Run locally

```bash
npm ci
npm run db:setup   # migrate + seed (idempotent; safe to re-run)
npm run dev        # http://localhost:3000
```

Useful scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run db:reset` (deletes only the local synthetic database, with confirmation).

## Entry route

Open `http://localhost:3000/` — it redirects to `/home`.

## Walkthrough: edit → persist → reload (implemented slice)

1. **Firm overview** (`/home`): consolidated committed capital, paid-in,
   distributions, and net TVPI (with DPI/RVPI) across all vehicles, plus a
   vehicles table. Every figure is derived from recorded investment events.
2. **Vehicle** (`/funds` → open a fund, e.g. `/funds/fund_one`): fund-level
   paid-in, distributions, residual value, and multiples, with the investments
   table (status, invested, distributions, residual, gross MOIC).
3. **Investment** (open a row, e.g. Northwind Robotics): position metrics, gross
   MOIC, illustrative gross IRR (ACT/365F), and the full dated event history.
4. **Record an event**: in "Record a new event", add a valuation mark (e.g.
   `18000000` on `2026-09-16`) and submit. The position, gross MOIC/IRR, and the
   fund and firm rollups update immediately.
5. **Confirm persistence**: reload the page (and, if desired, restart the dev
   server). The new event is still present because it is stored in SQLite.

## Notes

- The header shows a persistent "Independent prototype · Synthetic data" label.
- Modules beyond this foundation slice are marked `Planned` in the sidebar; see
  `docs/BUILD_STATUS.md` for the roadmap.
