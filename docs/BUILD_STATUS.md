# Build status

Updated 16 September 2026.

Independent local prototype of connected Fund Forecasting + Fund ERP. Synthetic data only. Not operated by Carta.

## Milestone

Milestone 6 is implemented and browser-exercised. Construction vs Current Forecast, Scenario Builder overlays, Time Machine as-of views, valuation posting, LP disclosure cutoffs, multi-entity waterfall modeling, and simulated distributions all mutate persistent SQLite state.

## Working journeys

- A. Construction / investments / Current Forecast / Scenario Builder / Time Machine (`/funds/fund_nb_ii/forecasting/*`)
- B. Data collection reject → draft valuation → explicit post → ledger NAV increase
- C. Fundraising countersign → capital-call receipts → LP Portal (Atlantic vs Meridian cutoff)
- D. Multi-entity waterfall run vs separate simulated distribution (`SIM-` refs, no bank transfer)

## Checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | passed (exit 0) |
| Typecheck | `pnpm typecheck` | passed (exit 0) |
| Unit/workflow tests | `pnpm test` | passed — 34 tests, 2 files |
| Production build | `pnpm build` | passed — Next.js 16.3.5 |
| Database setup | `pnpm db:setup` | seeded `data/fund-erp.sqlite` (gitignored) |
| Browser journeys | headed Playwright against `pnpm dev` + earlier computer-use pass | Journey A video; screenshots for A–D |

Browser observations:

- Home Fund II TVPI is a positive matched multiple after credit-normal paid-in (was −0.59x before the accounting sign fix).
- Construction deal count 21.95 is unchanged in Current Forecast, Scenario overlay, and Time Machine as-of 2025-06-30.
- Heavier follow-on scenario remaining $73,000,000 → $91,250,000; deal count 21.95 on both columns; no Apply-to-base.
- Nested Save Changes preserves Nimbus post-money / projected exit (`$3,080,000` unrealized). Version conflicts now redirect with an error instead of a blank page.
- Posting a Nimbus draft increased booked FV (e.g. ~$15.0M → ~$19.8M) and wrote `valuation_posting` journals. Remaining drafts stay unposted.
- Meridian LP Portal cutoff `2025-12-31` omits later notices; other LP names are not in the payload.
- Waterfall run produces stakeholder proceeds without paying anyone. Distributions use `SIM-` payment refs after simulated bank confirmation.

## Assumptions

- Demo clock `2026-09-16`
- SQLite local file persistence (`DATABASE_PATH` override for tests)
- European waterfall profile only; American/deal-by-deal is typed `unavailable`
- Nested save: client draft until parent Save Changes
- Optimistic versioning on investment save (intentional deviation from last-save-wins)
- Scenario overlays: `followOnBoost` / `remainingMultiplier` / `exitHaircut` applied to Current Forecast snapshot
- Prototype accounting policy `prototype_capital_activity_v1`

## Deliberate deviations / unsupported

- OPM/backsolve, American waterfall, PIK loans remain unsupported and labeled
- External banking, tax, KYC, signatures, formation, email, and Ramp are labeled simulations
- Source evidence for original screens remains D

## Remaining work

- Company/fund display names on a few operational tables still mix IDs in some CRM lists
- Playwright `e2e/smoke.spec.ts` is a thin smoke; headed demo scripts live in `scripts/browser-demo*.mjs`
- American waterfall / OPM engines remain intentionally unimplemented
