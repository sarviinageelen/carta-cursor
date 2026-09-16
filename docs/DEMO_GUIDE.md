# Demo guide

Independent prototype · synthetic data · local only. Start with `pnpm db:setup && pnpm dev`, then open `/login`.

Default demo clock: **2026-09-16**.

## Personas

| Persona | Email | Use for |
| --- | --- | --- |
| Investment editor | alex.chen@northbridge.example | Journey A |
| Fund operations | morgan.vale@northbridge.example | Posting valuations, issuing calls |
| Investor relations | priya.shah@northbridge.example | Closings |
| LP Atlantic | lp.atlantic@investors.example | LP Portal (full current) |
| LP Meridian | lp.meridian@investors.example | LP Portal with 2025-12-31 cutoff + missing bank details |
| Company submitter | cfo@lumenforge.example | KPI submission |
| Auditor | auditor@fieldstone.example | Audit evidence (read-only) |
| Harborstone admin | harbor.admin@harborstone.example | Second-firm isolation |

## Journey A — Construction → investment → case → Current Forecast → scenario

1. Log in as Alex Chen.
2. Open `/funds/new` or `/funds/fund_nb_ii/forecasting/construction`.
3. Inspect sector probabilities and allocation budget. Save a stage or allocation; projected deal count updates.
4. Open `/funds/fund_nb_ii/forecasting` and toggle Construction vs Current. Construction deal count stays the inception model.
5. Open `/funds/fund_nb_ii/forecasting/investments/inv_nimbus_ii`. Edit a nested event, close the nested editor, **Save Changes**. Reload — the event remains. Cancel would restore the last persisted events.
6. Open `/funds/fund_nb_ii/forecasting/scenarios`. Recalculate **Heavier follow-on**. Remaining increases vs baseline; construction deal count stays the same. Open `/funds/fund_nb_ii/forecasting/time-machine?asOf=2025-06-30` to view historical metrics without rewriting stored events.

## Journey B — Collection → review → draft valuation → post → NAV

1. Open `/data-collection`. Review Lumenforge source-line answers (`P&L!B12`).
2. Accept or reject the pending KPI (`21,000,000` vs prior `18,000,000`). Rejection leaves the accepted ARR at 18,000,000.
3. Open `/submit/sub_lumenforge_q2_demo` as a scoped submitter link.
4. Open `/valuations`. Note Fund II investments FV. Create or edit a **draft**. Booked FV is unchanged.
5. Switch to Morgan Vale (fund ops) and **Post**. Ledger `/funds/fund_nb_ii/operations/ledger` and Home FV update. Posting again is idempotent.

## Journey C — LP prospect → closing → call → LP Portal

1. Open `/fundraising`. Advance Solstice from signed → countersigned (simulated signature).
2. Open `/funds/fund_nb_ii/operations/calls`. Meridian is partially received. Record the remaining receipt.
3. Issue a new call as fund ops.
4. Switch to Atlantic LP → `/lp`. Only Atlantic commitments appear.
5. Switch to Meridian LP. Disclosure cutoff `2025-12-31` omits later-dated notices at the data layer.

## Journey D — Waterfall model → separate distribution simulation

1. Open `/waterfalls`. Run Helios exit structure. Changing inputs marks results stale until rerun. This does not pay anyone.
2. Open `/funds/fund_nb_ii/operations/distributions`. Seed distribution is blocked on Meridian missing bank details.
3. Confirm bank details and retry. Payment references are `SIM-…`. No bank transfer occurs.
4. Retry does not duplicate journals (`sourceType` + `sourceId` idempotency).

## Other useful routes

- `/home` firm graph table alternative
- `/crm/deals` spreadsheet pipeline
- `/carry` vesting vs cash
- `/tax` sample documents, not filings
- `/kyc` fixture flags
- `/management-company` Ramp fixture + intercompany
- `/spvs` simulated formation checklist
- `/allocator` aggregate TVPI
- `/loans/loan_volt` ACT/365F interest
- `/data-explorer` warehouse freshness label
- `/published/pub_nb_ii_reader_demo` read-only snapshot
