# Implementation notes

Source-backed decisions, assumptions, and limitations for the prototype. Research
files under `docs/carta/` are unchanged.

## Stack (resolved versions)

- Node 22, Next.js 15.5.x (App Router), React 19, strict TypeScript.
- Tailwind CSS 3.4 for styling.
- SQLite via Drizzle ORM with the `better-sqlite3` driver (zero-account local DB).
- `decimal.js` for exact money and rate arithmetic.
- Vitest for domain/service tests.

These match the brief's default stack. pnpm is available, but npm with a
committed `package-lock.json` was chosen so the Cloud Agent `install`
(`npm ci`) is fully reproducible.

## Money and numeric conventions

- Monetary amounts are stored as canonical decimal strings in SQLite and parsed
  into `Decimal` in the domain layer. No floating-point money arithmetic.
- Rounding happens only at display boundaries (`formatCurrency`, `formatMultiple`,
  `formatPercent`).
- Undefined results (e.g. zero paid-in denominator, IRR with no sign change) are
  returned as typed unavailable/error values, never `NaN`/`Infinity`/fake zero.

## Supported calculation profiles

- **LP multiples**: `DPI = distributions / paidIn`, `RVPI = residualValue / paidIn`,
  `TVPI = (distributions + residualValue) / paidIn`. By construction
  `TVPI = DPI + RVPI`. Verified by the brief's matched-basis fixture
  (paid-in 10, distributions 3, residual 12 → DPI 0.3x, RVPI 1.2x, TVPI 1.5x).
- **Dated IRR**: ACT/365F day count; NPV solved by sign-bracketed bisection with
  a documented tolerance (1e-9). The fixture −100 on 2025-01-01 and +110 on
  2026-01-01 yields 10%. Multiple sign changes produce a warning rather than an
  assertion of a unique root.
- **Residual value**: most recent valuation mark for active positions; zero for
  realized and written-off positions regardless of any stale mark.

The gross IRR shown on the investment detail page treats the latest residual
mark as a terminal inflow for still-active positions; this is an illustrative
prototype convention, not a realized return.

## Deliberate scope boundary

This change set implements Milestone 1 (running foundation + first vertical
slice) to establish and demonstrate the development environment. It does not
claim Carta visual or financial-engine parity, and the broader ERP modules in
the brief are not yet implemented. See `docs/BUILD_STATUS.md`.

## Data separations honoured so far

- Investment events (invest / distribution / valuation) are the single source of
  truth; dashboards derive from them via shared selectors, so a fund and firm
  rollup cannot drift from the underlying records.
- A shared portfolio company (Continuum AI) is held by both Fund II and the SPV
  as distinct investments; totals are not double-counted across a single fund.
