# Build status

_Last updated: 2026-09-16_

## Current milestone

Milestone 1 — Running foundation and first vertical slice (in place). The
repository now contains a runnable Next.js application, not just the build kit.
This work was scoped to establishing and demonstrating the development
environment; later milestones (2–6) remain to be built.

## What works end-to-end

- **Application shell**: sidebar navigation, header with persistent
  "Independent prototype · Synthetic data" label, breadcrumbs. Planned modules
  are labelled `Planned` rather than shown as finished pages.
- **Persistent local database**: SQLite via Drizzle (`better-sqlite3`) in
  `.data/`, with generated migrations and a deterministic, idempotent seed.
- **Connected records**: firm → funds/SPV → investments → dated investment
  events. Shared portfolio-company exposure (Continuum AI in Fund II and the
  SPV) is modelled.
- **Derived metrics**: firm overview, fund list, and fund detail derive
  paid-in, distributions, residual value, DPI/RVPI/TVPI, and gross MOIC from
  recorded events through shared domain selectors — no hardcoded totals.
- **First vertical slice (edit → persist → reload)**: an investment detail page
  records dated events (valuation mark / distribution / capital deployment)
  through a validated server action. New events persist to SQLite and update the
  investment, fund, and firm rollups after revalidation; they survive reload and
  server restart.
- **Tested financial domain**: LP multiples and dated IRR (ACT/365F) with typed
  unavailable/error results.

## Checks run (2026-09-16)

| Check | Command | Result |
| --- | --- | --- |
| Unit tests | `npm test` | 11 passed (metrics, IRR, portfolio) |
| Type check | `npm run typecheck` | Passed |
| Lint | `npm run lint` | No warnings or errors |
| Production build | `npm run build` | Compiled successfully (6 routes) |
| DB setup idempotence | `npm run db:setup` (twice) | Second run skips seed |

## Supported calculation profiles (this slice)

- LP-basis multiples: `DPI = distributions / paidIn`, `RVPI = residual / paidIn`,
  `TVPI = DPI + RVPI`. Zero/negative paid-in returns a typed unavailable result.
- Dated IRR under an explicit ACT/365F convention with bracketed bisection;
  no-sign-change, no-solution, and non-converged cases are typed statuses.
- Residual value uses the most recent valuation mark; realized and written-off
  positions carry zero residual.

## Not yet implemented (later milestones)

Forecasting depth (cases/scenarios/actuals/historical mode/KPIs/formulas/
reserves), Deal & LP CRM, closings/capital calls/receipts, LP Portal,
valuations/posting, waterfalls/carry, distributions, ManCo/audit/tax/KYC,
allocator analytics, loan operations, Data Explorer, publishing/permissions.
See `docs/carta/implementation_tracker.json` for per-family status.

## Exact next tasks

1. Milestone 2: build the Forecasting workspace (construction sections, current
   vs. construction forecast, scenarios) reusing the domain services here.
2. Add a demo persona selector and server-side authorization scaffolding.
3. Add Playwright e2e coverage for the edit→persist→reload journey.
