# Build status

Updated 16 September 2026.

Independent local prototype of connected Fund Forecasting + Fund ERP. Synthetic data only. Not operated by Carta.

## Milestone

Milestone 6 implementation is in the repository: scaffold, schema, seed, domain engine, four demo journeys, remaining ERP surfaces, Scenario Builder comparison, Construction sections 4–7 editors, and Time Machine. Browser visual review of the four journeys is the remaining verification pass.

## Working journeys

- A. Construction / investments / Current Forecast / Scenario Builder (`/funds/fund_nb_ii/forecasting/*`)
- B. Data collection / KPI review / draft vs posted valuation / ledger NAV
- C. Fundraising closing / capital call receipts / LP Portal disclosure cutoff
- D. Multi-entity waterfall run vs simulated distribution with missing-bank branch

## Checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | passed (exit 0) |
| Typecheck | `pnpm typecheck` | passed (exit 0) |
| Unit/workflow tests | `pnpm test` | passed — 33 tests, 2 files |
| Production build | `pnpm build` | passed — Next.js 16.3.5, all listed routes dynamic |
| Database setup | `pnpm db:setup` | seeded `data/fund-erp.sqlite` (gitignored) |
| Playwright e2e | `pnpm test:e2e` | not yet run in this verification pass |
| Browser visual review | manual journeys A–D | not yet run |

## Assumptions

- Demo clock `2026-09-16`
- SQLite local file persistence (`DATABASE_PATH` override for tests)
- European waterfall profile only; American/deal-by-deal is typed `unavailable`
- Nested save: client draft until parent Save Changes
- Optimistic versioning on investment save (intentional deviation from last-save-wins)
- Scenario overlays: `followOnBoost` / `remainingMultiplier` / `exitHaircut` applied to Current Forecast snapshot; construction deal counts stay inception values
- Prototype accounting policy `prototype_capital_activity_v1` (notice vs effective-date vs receipt) — not Carta’s verified LPA engine

## Deliberate deviations / unsupported

- OPM/backsolve, American waterfall, PIK loans remain unsupported and are labeled, not silently substituted
- Charting often uses dense tables plus metric cards rather than decorative charts
- External banking, tax filing, KYC, signatures, formation, email, Ramp are labeled simulations
- Source evidence for original screens remains D; prototype tests do not re-rate source evidence to V

## Remaining work

- Browser verification of journeys A–D and visual polish
- Playwright smoke against a running server
- Fill tracker `verification_status` / `browser_evidence` after the visual pass
