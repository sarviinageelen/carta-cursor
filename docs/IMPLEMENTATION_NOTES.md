# Implementation notes

Decisions for the independent Carta Fund ERP prototype. Research files in `docs/carta/` are unchanged.

## Stack

Next.js 16.3.5 App Router, React 19, TypeScript, Tailwind 4, Drizzle ORM + better-sqlite3, decimal.js, Vitest, Playwright. SQLite file at `data/fund-erp.sqlite`.

## Supported calculation profiles

See `src/domain/profiles.ts`. Unsupported configurations return typed `unavailable` results and are not silently replaced.

- Stage probabilities: residual failure; terminal graduation = 0.
- Construction: allocation-level expected cash flows; deal count = budget / expected cost per company.
- Current forecast: actual dated investment cash flows + remaining modeled capacity. Construction deal counts are not rewritten.
- LP multiples: DPI / RVPI / TVPI on a matched paid-in basis.
- IRR: ACT/365F; hybrid Newton/bisection; multiple sign changes are a warning.
- Fund waterfall: European whole-fund only. American/deal-by-deal is `unsupported`.
- Liq prefs: ordered seniority (0 = most senior); non-participating and participating with optional cap.
- Valuations: post-money, simple public comps, single-stage DCF. OPM/backsolve unsupported.
- Loans: fixed-rate ACT/365F only. PIK rejected.
- Formulas: tokenized arithmetic; no `eval`.

## Prototype accounting policy (G05)

Documented in `PROTOTYPE_ACCOUNTING_POLICY`. Notice, effective-date recognition, and cash receipt are distinct. Future-effective journals are stored but excluded from as-of balances. This is **not** Carta’s verified LPA engine.

## Intentional deviations

- Optimistic version checks on investment save (research documents last-save-wins).
- Collaborator invites require an explicit permission; they do not default to full write.
- Published links are immutable versioned snapshots with revocation.
- Nested event editor mutates client draft only; parent Save Changes persists. Cancel restores last persisted events (declared behavior; Carta nested cancel is unverified).
- Scenario Builder overlays remaining/unrealized on a Current Forecast snapshot (`followOnBoost`, `remainingMultiplier`, `exitHaircut`). Construction deal counts and posted journals are not rewritten.
- Time Machine recalculates as-of metrics from stored dated events and journals; it does not rewrite history.
- Visual layout, tokens, and navigation are implementation design — no current authenticated Carta screen was rated V.

## External simulations

Mail outbox, signatures, payments (`SIM-` refs), tax filing, KYC screening, Ramp import, SPV formation, and snapshot publishing are fixture-backed and labeled. No API keys are required.

## Unresolved / partial

- American waterfall, OPM/backsolve, full PIK/day-count matrix, live FX feeds, and true multi-root IRR uniqueness proofs remain unsupported.
- Charting uses tables plus compact metrics; Recharts is available but not required for every view.
- Entity graph is a selectable table of real relationships (plus Home description), not a decorative SVG of hardcoded totals.
