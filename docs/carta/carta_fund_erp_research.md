# Carta Fund ERP — Screen and Behavior Research Specification

Research date: 16 September 2026 | Version 1.0 | Official-source research, with explicit evidence limits

The product is sufficiently understood to define a substantial set of functional requirements. It is not yet sufficiently visually verified to promise a pixel-identical recreation. This document is the research foundation for a later build prompt, not that prompt and not a claim that every Carta screen has been inspected.

## 1. Scope, coverage and evidence quality

The research follows Carta Fund ERP across planning, deal and investor relationships, portfolio monitoring, fund operations and investor experiences. Fund Forecasting receives the deepest field-and-behavior coverage. It excludes Carta’s wider employee equity and legal-product suites except where they connect to fund workflows.

Evidence is based on original Carta product/support pages, official release notes, developer references and written product-tour transcripts. Text retrieval was used when embedded media failed. Public demo inspection, complete video-frame review and authenticated interaction testing were not achieved. No screenshot inventory is being passed off as complete.

| Output in this packet | Count / scope |
| --- | --- |
| Screen/view/editor families | 53: 33 Forecasting and 20 broader ERP families |
| End-to-end workflow maps | 12 |
| Acceptance contracts | 26 |
| Official-source records | 74 |
| Explicit unresolved issues | 16 |
| Current full screens visually verified | 0 — no visual-parity claim |

These counts describe the organization of this research, not the number of pages or features in Carta. A family may contain a page, tab, drawer, form or dialog. URL routes, dimensions and navigation hierarchy are not invented where only a functional label is documented.

| Label | Meaning |
| --- | --- |
| D | Documented by a retrieved official source; not necessarily executed or visually verified. |
| V | Directly inspected visual evidence. No full current screen in this inventory is rated V. |
| I | Proposed implementation interpretation or synthetic acceptance requirement. |
| U | Unresolved or unavailable evidence. |

## 2. Product architecture and boundaries

### Separate product surfaces

Forecasting, fund-administration visual accounting, Deal CRM, LP CRM, LP Portal and allocator analytics are distinct experiences. A shared brand does not establish one identical shell or menu. Sources: P01, T01, T02, T03, T06, P06.

### Separate economic states

Use different concepts for a construction plan, actual investment history, current forecast, investment case, fund scenario and posted accounting. This proposed architecture preserves documented distinctions; it is not Carta’s private schema. Sources: F10, F17, F18, F11, T09.

### Treat save, calculate, approve and post as different actions

Do not substitute a toast for a state transition. Some inputs require nested save, some require recalculation, some need review, and some enter accounting only when posted. Sources: F16, F18, F20, T09.

### Keep records scoped to legal entities and people

Connected records still have legal-entity, role and disclosure boundaries. LP-specific permissions and date-cutoff policies must change data access, not just hide tabs. Sources: T06, F24, F25.

### Preserve source and freshness

A company’s collected KPI, an imported investment event, a manual forecast assumption and a warehouse-derived metric have different provenance and update schedules. Sources: I01, I02, I03, D01.

### Distinguish service workflows from software calculations

Tax preparation, formation, compliance review and bank payment execution include human or external systems. A prototype can model statuses but must not claim those services were actually performed. Sources: T07, P05, T12, T16.

### Working persona map

| Persona | Primary workspaces | Boundary |
| --- | --- | --- |
| Investment team | Forecasting, Deal CRM, portfolio monitoring/valuations | Hypotheses and investment cases do not directly change booked accounting. |
| Finance / fund operations | Administration, capital activity, tax coordination, ManCo, audit | Legal-entity and approval context matters. |
| Investor relations | LP CRM, fundraising, closings, disclosure controls | Economic figures come from fund admin rather than independent CRM copies. |
| LP | Policy-filtered LP Portal; allocator analytics where separately provided | A GP’s portal is not the allocator’s complete cross-manager analytics suite. |
| Portfolio-company submitter | KPI / financial-document submission | Submission and acceptance are different states. |
| External auditor / tax adviser / compliance reviewer | Scoped evidence and professional workflows | Access and authority differ from an investment team editor. |

The persona grouping is an implementation interpretation, grounded in the module-specific sources below; it is not a complete published Carta permission matrix.

## 3. Fund Forecasting — screen and behavior inventory

All entries below are D for written evidence, not V for inspected visuals. Screen descriptions deliberately avoid invented padding, font sizes, icons, tab order or undocumented chart interactions.

### FF01 · Home and fund creation

Entry: Home → Create a New Fund.

Controls: Strategy templates and fund creation action.

Documented behavior: Select a starting strategy, enter the construction wizard, then complete setup. A template initializes assumptions; it is not proof of an investment policy.

Unverified: Exact Home cards, sort/filter controls, delete/duplicate actions and empty state.

Sources: F01.

### FF02 · Construction Wizard

Entry: New fund or existing construction configuration.

Controls: General; Sector Profiles; Allocations; Fees/Expenses; optional Recycling; Waterfall; optional Limited Partners.

Documented behavior: These seven documented sections define the model. Treat them as persistent economic inputs rather than disposable onboarding answers.

Unverified: Stepper appearance, save timing between sections, unsaved-change dialogs and complete validation copy.

Sources: F02.

### FF03 · General fund configuration

Entry: Construction → General.

Controls: Fund name, currency, start/end dates, commitment, GP commitment, call cadence, commitment schedules and vehicle structure.

Documented behavior: An omitted end date supports an evergreen model. SPV/no-construction mode disables automatic construction of new investments. A traditional construction fund and an actual legally formed SPV are different concepts.

Unverified: All current defaults; eligibility of credit-line options; exact validation and logo-placement behavior.

Sources: F03.

### FF04 · Sector-profile stage editor

Entry: Construction → Sector Profiles.

Controls: Stage rows; round size; pre/post-money value; option-pool dilution; graduation/exit probabilities; exit values; months to next stage/exit; add/remove/reorder.

Documented behavior: Failure probability is the remainder after graduation and exit. Their sum must not exceed 100%; the last stage cannot graduate. Reordering is documented. Stage timing is relative to entering that stage. Applying market data can replace profile assumptions.

Unverified: Exact rounding, validation messages, full market-data filter and overwrite confirmation UI.

Sources: F04.

### FF05 · Allocation editor

Entry: Current Allocations → New Allocation, or open an existing allocation.

Controls: Profile, entry stage, share of investable capital, initial amount/ownership target, follow-on amount/ownership target, participation and deployment horizon.

Documented behavior: The model deploys the allocation budget. Larger follow-on reserves can reduce the projected number of initial deals. Initial deployment pacing follows the investment horizon; follow-on timing follows stage graduation timing.

Unverified: Granular timing controls beyond the documented horizon, dirty-state behavior and all allocation-sum constraints.

Sources: F05, F34.

### FF06 · Fee and expense schedules

Entry: Construction → Fees/Expenses.

Controls: Fee profiles with dated tiers, percentage and fee basis; additional tiers; expenses with monthly amount and dates.

Documented behavior: Different LPs can use different fee profiles. Bases include commitments, several called-capital measures, invested capital, fair value and unrealized cost. Recycling settings exist at fee-tier level.

Unverified: Every tier-overlap rule, day-count convention, fee-on-fee behavior and rounding.

Sources: F06.

### FF07 · Exit-recycling configuration

Entry: Construction → Recycling.

Controls: Recyclable percentage, cap relative to commitments, recycling term, optional use of anticipated proceeds.

Documented behavior: The anticipation option allows earlier deployment based on future exits; otherwise recycling waits for exits. Fee recycling and exit recycling have different caps. Neither represents fresh LP commitments.

Unverified: Interaction of simultaneous caps, shortfall handling and detailed ledger presentation.

Sources: F07.

### FF08 · Fund-level waterfall assumptions

Entry: Construction → Waterfall.

Controls: European/American structure, preferred return/hurdle, catch-up and carried-interest settings.

Documented behavior: The documentation distinguishes whole-fund and deal-level distribution approaches. Returns on the GP commitment are separate from GP carry.

Unverified: Complete legal waterfall semantics, clawback interpretation and uncommon tier structures. Do not confuse this with multi-entity ERP waterfall modeling.

Sources: F08.

### FF09 · Modeled limited partners

Entry: Construction → Limited Partners.

Controls: Add/import LPs, contributions/schedules, fee-profile assignment, optional custom profit splits.

Documented behavior: Without detailed LPs, returns can be modeled for an aggregate LP bucket. Custom splits can vary by distribution tier; this is a modeling input, not the LP-facing investor portal.

Unverified: Links to actual legal investor records, contribution-schedule error rules and current entitlement.

Sources: F09.

### FF10 · Construction/Current analytical dashboard

Entry: Model/dashboard header forecast selector.

Controls: Construction Forecast and Current Forecast selection; computed analytics.

Documented behavior: Construction excludes actual investments. Current incorporates actual investments and projects remaining deployment. Changes to construction assumptions after deployment concern remaining capital, not rewriting historical transactions.

Unverified: Current full tab order, chart layouts, hover behavior, axes, legends, zooming, default periods and exact navigation shell.

Sources: F10.

### FF11 · Monthly cash-flow actuals editor

Entry: Model View → Period → Current Forecast + Monthly → Edit Actuals.

Controls: Editable cells for commitments, calls, fees, expenses, recycling and distributions; Save Edits.

Documented behavior: The guide identifies editable actuals in blue. Saving changes actual cash-flow reporting, but does not itself replan future investments or change projected deal count/investable capital.

Unverified: Cell-level validation, locked periods, paste handling, undo and conflict resolution.

Sources: F11.

### FF12 · Actual-investments table

Entry: Investments.

Controls: Company and investment fields, status, ownership, invested/reserved capital, current/exit returns and reporting attributes.

Documented behavior: This is a consolidated view of actual portfolio records. Planned is a forecasting investment status; it is not automatically a Deal CRM pipeline stage.

Unverified: Precise default columns, sorting, filtering, pagination and row-action menus in the current account.

Sources: F12, F13.

### FF13 · Saved table views and report configuration

Entry: Investments → Columns; Portfolio Summary report → Customize.

Controls: Select fields; save a default/new/replacement view; load an investment view into report configuration.

Documented behavior: A saved column selection can be reused for an Excel portfolio report. Field catalogs vary by surface/version; do not fix the product to a marketing count of metrics.

Unverified: Per-user versus shared ownership of saved views, exact report format and export formatting.

Sources: F14.

### FF14 · Investment creation and editor

Entry: Investments → Add Investment → profile → entry stage.

Controls: Name and descriptive fields; first investment event; exit event; bulk Excel import.

Documented behavior: A future first investment is Planned. The guide requires at least one investment round and one exit event, which may be projected. First investment date cannot precede fund inception. Imported rounds need future/exit assumptions reviewed.

Unverified: Complete forms, import-template columns, merge/deduplication, delete behavior and status-transition rules.

Sources: F15.

### FF15 · Round/event editor

Entry: Investment case → Add event → Edit.

Controls: Financing, ownership update, valuation update, secondary purchase, partial sale, investment income; reserve/pro-rata and priced-share inputs.

Documented behavior: Closing the nested event editor is followed by Save Changes on the investment. Future rounds can be generated from a profile. Priced-share entry is not the SAFE/note input flow.

Unverified: Exact dirty-state/cancel behavior and calculation order for same-date events.

Sources: F16.

### FF16 · Investment performance cases

Entry: Investment editor → Add Case / case Actions.

Controls: Case probabilities, event sequences, clone, historical synchronization, future-round generation and case results.

Documented behavior: Case probability and within-case graduation probability are distinct. Cloning a case copies its rounds; historical synchronization copies historical events only. The guide allows up to ten cases per investment.

Unverified: Probability normalization, treatment of missing probabilities and deletion confirmations.

Sources: F17.

### FF17 · Fund-wide Scenario Builder

Entry: Sidebar → Scenario Builder → Create Scenario.

Controls: Scenario name, modified assumptions across construction/investments, recalculation, save and comparison results.

Documented behavior: A scenario combines changes at fund level; choosing an investment case is only one input. Recalculate and Save Scenario are documented actions.

Unverified: Exact unsaved-state appearance, baseline comparison columns and whether/how a scenario can be applied to the base model.

Sources: F18.

### FF18 · Time Machine historical view

Entry: Investments → Time Machine in the top-right header.

Controls: Historical month, active-state button, Reset to today.

Documented behavior: Investment metrics recalculate for the selected month. The guide describes a red active-state control. Reset restores the present-day view. This is not restoration of an old saved version.

Unverified: Effect on every other module, date boundary conventions and whether the selection survives navigation/reload.

Sources: F19.

### FF19 · KPI definitions and values

Entry: Sidebar → KPI Manager → company → Add KPI.

Controls: Predefined/custom metrics, quantitative/qualitative types, cadence, periods and data grid.

Documented behavior: Metrics are saved against a company; linked source collection and user-entered values must retain their distinct provenance.

Unverified: Every allowed metric type, precise missing-data convention and definition-edit behavior.

Sources: F20.

### FF20 · KPI requests and review

Entry: KPI Manager → Requests.

Controls: Contacts, request period, selected metrics, access protection, send/copy link, review and approval settings.

Documented behavior: Request states include Pending Update and Pending Review. Recipients submit without creating an account. Managers compare old/new values and accept or reject. Auto-Approve can bypass manual review.

Unverified: Email delivery errors, reminder defaults, link expiry and exact permission matrix.

Sources: F20.

### FF21 · Custom formula builder

Entry: Sidebar → Formulas.

Controls: Named variables from KPIs or reporting fields; relative periods; equation and output type; Calculate; Save/Load Formula.

Documented behavior: Formula results can be inspected and downloaded. Relative KPI periods shift when recalculated, rather than remaining fixed to the original calendar dates.

Unverified: Expression grammar, null/error propagation, cross-company aggregation and security implementation.

Sources: F21.

### FF22 · Follow-on reserve analysis

Entry: Insights → Optimal Reserves Ranking.

Controls: Company comparison of expected return on the next reserve dollar, planned reserves and deployed capital.

Documented behavior: The ranking measures incremental follow-on economics, not simply the return already achieved on the original investment. It is an analytical view, not an instruction to automatically transact.

Unverified: Exact chart encoding, full return calculation, optimization constraints and interactive selection behavior.

Sources: F22.

### FF23 · Document Center

Entry: Documents → Add.

Controls: Document name, optional investment/category association and bulk upload.

Documented behavior: Files can be organized within forecasting and linked to investment context. These are not automatically the full audit/tax-document repository.

Unverified: Previewer, version replacement, deletion, malware scanning and folder behavior.

Sources: F23.

### FF24 · Publishing controls and reader

Entry: Publish → Start Publishing.

Controls: Read-only link, optional access protection, GP-data visibility, LP-specific disclosure options.

Documented behavior: Publishing is different from inviting an editor. The published experience is read-only; LP-scoped disclosure can exclude other LP returns.

Unverified: Live-link versus snapshot refresh semantics, revocation, expiry, exact reader layout and export permissions.

Sources: F24.

### FF25 · Collaborator administration

Entry: Home → Manage Collaborator, or sidebar → Collaborators.

Controls: Email invitation and section-level read/write permissions.

Documented behavior: The guide describes an account requirement and a default full-write invitation. Do not assume a read-only default merely because that would be safer design.

Unverified: Every permission row, invitation expiry and current plan requirements.

Sources: F25.

### FF26 · Multi-fund analytical view

Entry: Home → Multi-Fund View → Create a Multi-Fund View.

Controls: Name, vehicle selection and Save.

Documented behavior: Selected vehicles are pooled for analytics; the guide requires the same fund currency. This is not an ownership transaction or a fund-of-funds investment.

Unverified: Exact consolidated metric logic, eliminations, supported count and current packaging.

Sources: F26.

### FF27 · Round-currency and FX controls

Entry: Investment → round editor.

Controls: Round currency and exchange rate; manual entry or lookup; valuation update.

Documented behavior: Round inputs retain their currency while fund reporting uses fund currency. The guide describes later valuation updates for FX revaluation; closing the round still requires investment-level save.

Unverified: Rate source/date conventions, precision and FX attribution in every metric.

Sources: F27.

### FF28 · Investment integration review

Entry: Carta/Forecasting integration setup and update review.

Controls: Entity/company matching, selection of incoming rounds, retention of existing events and source indicators.

Documented behavior: Release documentation permits keeping forecasting events and selecting imported records. Fund-admin customers can source transactions from the schedule of investments, enriched by cap-table financing history.

Unverified: Exact permission roles, retry/conflict states and deep setup substeps; non-Carta support described as coming soon is not assumed live.

Sources: I01, R01.

### FF29 · Fund-actuals integration

Entry: Fund-admin integration setup/review.

Controls: Partner details, commitments, capital calls, distributions, fees and expenses imported from accounting.

Documented behavior: This integration connects official fund actuals to modeling. It is separate from importing company cap-table rounds and from company KPI synchronization.

Unverified: Field-level overwrite precedence, posting-versus-cash conventions, lock periods and detailed sync status UI.

Sources: I02, R03.

### FF30 · Company-financials synchronization

Entry: Data Collection/RFI → linked KPI Manager.

Controls: Linked company financials and KPIs; downstream analytics.

Documented behavior: For the documented joint-product integration, Data Collection/RFI is the source of truth and confirmed data synchronizes into forecasting. Do not confuse this with manual KPI request approval settings.

Unverified: Bidirectional edits, exact refresh delay and conflict behavior.

Sources: I03, R02.

### FF31 · SAFE/note conversion and ownership updates

Entry: Round security type → SAFE/Note; subsequent priced round.

Controls: Investment amount, round size, cap; conversion simulation or post-conversion ownership/share inputs.

Documented behavior: Ownership after conversion is supplied through an ownership update or priced-round share data. The guide recommends the cap-table calculator for competing instruments. A default value based on the latest cap can be overridden by a valuation event.

Unverified: Full calculator layout, conversion engine and uncapped-instrument treatment beyond the documented modeling workarounds.

Sources: F31.

### FF32 · Investment liquidation preferences

Entry: Case Actions → Liq Prefs → enable.

Controls: Preference amount, participation/cap settings and surrounding preference stack; import from another case.

Documented behavior: An active indicator appears on the exit event. This affects an investment exit, not the GP/LP fund waterfall.

Unverified: The guide has an inconsistent senior/junior label-description pairing. Verify actual stack ordering before implementing calculations.

Sources: F32.

### FF33 · Fund-of-funds investment

Entry: Investments → Fund Investments → Add a Portfolio Fund.

Controls: Existing modeled portfolio fund, investment amount, Construction/Current source forecast and Save.

Documented behavior: Parent and child are separately modeled funds. The child’s calls/LP distributions become the parent’s investment cash flows. Same currency is required; nested FoF is documented as unsupported.

Unverified: Current entitlement and exact aggregation display. Documented start/end-date assumptions should be separately fixture-tested.

Sources: F33.

## 4. Broader Fund ERP — screen and behavior inventory

These entries describe module-specific surfaces. They must not be flattened into the Forecasting UI or treated as universally enabled within one customer account.

### ERP01 · Visual-accounting home and entity graph

Entry: Fund-administration homepage.

Controls: Investment search, entity selection, connected fund/LP/GP records and workflow-focused views.

Documented behavior: The tour positions investments left and funds centrally, with connected ownership interests. Selecting an entity reveals related economics; valuation/capital activity can be followed through the structure.

Unverified: Full current layout, zoom/selection mechanics, node types and navigation permissions. Written spatial descriptions are not screenshot verification.

Sources: T01.

### ERP02 · Deal CRM records, relationships and pipeline

Entry: Deal CRM; email ingestion or company record.

Controls: Spreadsheet-style records, Interactions, People, pipeline stages, assigned coverage, advisers and AI research/query surfaces.

Documented behavior: The email agent extracts incoming deal context. Interaction feeds combine team emails, meetings and notes under firm access rules. Configurable enrichment and document-based briefs are described.

Unverified: Do not infer Kanban dragging, perfect AI extraction, automatic deduplication or deal-to-investment conversion.

Sources: T02, P08, R05.

### ERP03 · LP CRM record and fundraising workspace

Entry: Investor record or Fundraising module.

Controls: Relationship feed, commitments/performance, official communications, documents with engagement data, fundraising stages and closing initiation.

Documented behavior: Fund admin supplies the economic record; IR works through the CRM. Subscription documents can be sent singly or in bulk, with closing status tracked.

Unverified: Exact stage configuration, automated transitions, pipeline layout and write access to economic fields.

Sources: T03, P09.

### ERP04 · Closing command center and subscription review

Entry: Closing initiated from investor/fundraising context.

Controls: Investor progress, questionnaire, tax uploads, subscription package, countersign and optional first capital call.

Documented behavior: Documented progression is Invited → In progress → Signed → Countersigned. Existing LP data can prefill forms. Managers review the completed package before countersigning.

Unverified: Signer authority, rejected/reopened states, legal-document generation rules and premium conditional logic.

Sources: T04.

### ERP05 · Capital-call creation and notices

Entry: Quick Actions → Call Capital → entity.

Controls: Call type, amount, participants/parameters, health checks, per-LP amounts, wire confirmation and notice preview.

Documented behavior: The general tour describes sending a call and creating a journal dated to its due date. An older PE tour describes GL reflection after funding; keep recognition and payment events separate until resolved.

Unverified: Exact LPA checks, approvals, cancellation/reissue rules, late payments and accounting timing discrepancy.

Sources: T05, T18.

### ERP06 · LP-facing portal and GP disclosure controls

Entry: LP consolidated holdings → entity; GP investor policies.

Controls: SOI/performance, notices, documents, capital accounts, transaction ledger and wire details, subject to policy.

Documented behavior: A login can expose the LP’s commitments across GPs. GPs control tab visibility and financial disclosure by LP, including date cutoffs; newly closed LPs inherit the selected policy.

Unverified: All tab labels and layouts, role combinations, export permissions and cross-GP identity handling.

Sources: T06.

### ERP07 · Fund Tax workspace

Entry: Year-end questionnaire → Tax Dashboard.

Controls: Missing-data tasks, LP contact requests, return review, K-1 delivery, representative access and e-filing.

Documented behavior: The tour includes AI preparation followed by a licensed CPA’s finalization, then client review/signing and filing status. Estimates and final tax documents are separate outputs.

Unverified: All exact status names, reject/amend flows, jurisdiction variants and approval permissions. Never treat the demo as a real filing service.

Sources: T07.

### ERP08 · Data Collection configuration, submission and validation

Entry: Collection dashboard → company or request setup.

Controls: Reporting period/currency, financials/KPIs/custom questions, contacts, cadence, reminders and upload links.

Documented behavior: Uploaded financials undergo extraction and checks. Clicking an aggregate can trace contributing line items; confirmed values are saved with an audit trail into company financials/KPIs and downstream data tools.

Unverified: Extraction confidence rules, conflict resolution, attachment limits and handling of failed/late submissions.

Sources: T08.

### ERP09 · Portfolio valuation workbench and posting

Entry: Company → new/copy/roll-forward valuation.

Controls: As-of cap table, financial import, comparables, method weights, allocation analysis, report export and posting confirmation.

Documented behavior: Methods include backsolve, post-money, public comparables, M&A and DCF. Results can be allocated through a capital structure. An explicit confirmation precedes posting into the investment schedule/ledger and related NAV updates.

Unverified: Exact method formulas, solver/discount settings, approvals and one garbled technical term in the transcript. Draft analysis is not posting.

Sources: T09.

### ERP10 · Multi-entity waterfall analysis

Entry: Deal group → structure → Waterfall Modeling.

Controls: Pan/zoom structure; exit value/date; Run; own-fund versus deal-level results; stakeholder filters; expandable paths; Breakpoints matrix.

Documented behavior: Proceeds, MOIC and IRR can be examined by stakeholder and distribution tier. A changed exit value requires running the analysis again.

Unverified: All tier-editing controls, solver behavior, legal restrictions and save/export states. This does not initiate payments.

Sources: T10.

### ERP11 · GP carry and vesting

Entry: Linked fund and GP entity; GP LLC interests.

Controls: Carry-unit issuance, vesting schedules and member economics.

Documented behavior: The tour links booked fund gains through the configured waterfall to vested member carry. Carry accrual or a valuation gain is not itself evidence that cash was paid.

Unverified: Forfeiture, termination, transfers, clawback, rounding and every date convention.

Sources: T11.

### ERP12 · Distribution authorization and payment tracking

Entry: Fund Capital Activity → Request Distribution.

Controls: Recipient authorization, bank-detail exceptions, consolidated transfer approval and investor-level tracking.

Documented behavior: The documented flow includes Carta operations and an external bank approval. Individual net payments use confirmed LP instructions; missing details are flagged. Payment IDs and notifications support tracking.

Unverified: Precise payment-status vocabulary, reversal/error behavior and real integration permissions. A recreation must clearly simulate any disconnected payment action.

Sources: T12.

### ERP13 · Management-company accounting

Entry: ManCo expense, balance and reporting views.

Controls: Expense allocations, intercompany balances, bulk settlement, subaccounts, reporting tags and journal drill-down.

Documented behavior: Allocated spend generates intercompany accounting. The tour also describes budgeting/scenario work in Claude for Excel; that is an external integration, not proof of an identical native Carta budget editor.

Unverified: Every approval state, allocation rule and settlement screen.

Sources: T13.

### ERP14 · Ramp expense integration

Entry: Linked Ramp spend → Carta general ledger.

Controls: Category/account mappings, expense splits, reporting tags and attached evidence.

Documented behavior: Cards, bills and reimbursements can flow into accounting. Multi-entity splits create intercompany entries; invoices/receipts accompany the records.

Unverified: Exact setup UI, sync exceptions, permissions and transaction-conflict resolution. Do not replace actual Ramp screens with an invented native workflow.

Sources: T14.

### ERP15 · Auditor workspace

Entry: Reports and Documents → Audit → entity/year.

Controls: Audit-area categories, supporting documents, grouped downloads and confirmation requests.

Documented behavior: Accounting, investment and tax evidence is assembled from connected records; the tour includes direct audit confirmations to portfolio companies and monitoring for missing documents.

Unverified: Auditor-specific permission granularity and all document-refresh/error states.

Sources: T15.

### ERP16 · KYC and ongoing diligence

Entry: KYC dashboard → investor → request or result.

Controls: Verification status, secure document requests, watch-list results, review flags/history and CDD report.

Documented behavior: The tour describes identity and screening workflows with compliance review. A flag requires investigation; it is not an automatic conclusion about the investor.

Unverified: Risk scoring, screening vendors, disposition rules, escalation and jurisdictional policy. A prototype must not claim actual verification.

Sources: T16.

### ERP17 · Data Explorer and warehouse-backed analysis

Entry: Curated collections → dashboard/table or new query.

Controls: Entity filters, starting table, filters/aggregation, chart type, saved/shared queries and AI query assistance.

Documented behavior: The tour connects accounting/ownership data to analytical views. Developer documentation identifies periodic refreshes, so a data-warehouse dashboard must not imply every record is instantaneously current.

Unverified: Exact present-day product naming, SQL/semantic-layer rules, entitlements and permissions on sharing.

Sources: T17, D01, R04.

### ERP18 · SPV formation and ongoing administration

Entry: SPV guided formation and close.

Controls: Formation/legal/banking steps, investor subscriptions, capital activity, reporting and tax-service coordination.

Documented behavior: Formation involves real services and legal entities. The subsequent SPV uses administrative workflows such as closings and the LP portal; this is not the forecasting model’s no-construction switch.

Unverified: Full formation wizard, legal templates, region-specific sequence, service pricing and activation states.

Sources: P05.

### ERP19 · Allocator-facing LP Portfolio Analytics

Entry: LP analytics document/data workspace.

Controls: Document intake, extraction/validation, traceable data and portfolio dashboards.

Documented behavior: This serves an allocator evaluating alternative assets across managers: concentration, allocation-policy deviation and cohort comparisons. It is distinct from an individual GP’s LP Portal or fundraising CRM.

Unverified: Detailed screens, intake queues, remediation dialogs, metric look-through logic and portfolio-aggregation rules.

Sources: P06.

### ERP20 · Loan Operations and borrower/co-lender access

Entry: Loan setup, reconciliation, covenant and reporting workspaces.

Controls: Loan terms/draws, rates/PIK, repayments, invoices, payment reconciliation, covenant documents and reports.

Documented behavior: Loan activity connects to accounting. Borrowers/co-lenders have separate document/data access. The product supports standalone use, but connected functionality depends on setup.

Unverified: Actual wizard/screens, interest/day-count calculations, amendments, allocation rules and full role matrix.

Sources: P07.

## 5. End-to-end workflow contracts

Arrows express documented semantic progression, not proof of exact screens or complete state-machine labels. Cross-module links are limited to flows supported by the sources; for example, a seamless Deal CRM → booked investment conversion is not assumed.

### WF01 · Create and construct a fund

```text
FF01 → FF02 → FF03–FF09 → FF10
```

Persist economic configuration and present computed output; do not invent unobserved template defaults. Sources: F01, F02, F10.

### WF02 · Maintain a portfolio investment

```text
FF12 → FF14 → FF16 → FF15 → save investment → FF12/FF10
```

Nested event editing must affect the correct case and only persist through the documented parent save. Sources: F15, F16, F17.

### WF03 · Compare a fund scenario

```text
FF17 → edit assumptions → recalculate → compare → save scenario
```

Scenario changes remain distinguishable from base records and official accounting; applying-to-base remains unverified. Sources: F18.

### WF04 · Review a historical period

```text
FF12 → FF18 → chosen month → reset to today
```

Historical analysis changes the displayed time context, not the underlying stored history. Sources: F19.

### WF05 · Collect company KPIs

```text
FF19 → FF20 → recipient submission → review or configured auto-approval
```

Accepted values and pending submissions are separate states. Sources: F20.

### WF06 · Progress an LP to a closed commitment

```text
ERP03 → ERP04 → countersign → optional capital call → ERP06
```

Carry investor context into administrative records while respecting disclosure policy. Sources: T03, T04, T06.

### WF07 · Issue a capital call

```text
ERP05 → configure → checks → amounts/wires → preview → submit → track funding
```

Notice issuance, due-date recognition and cash receipt require distinct events; exact Carta journal timing is unresolved across sources. Sources: T05, T18.

### WF08 · Collect data and post a valuation

```text
ERP08 → validate/save → ERP09 draft valuation → review allocation → confirm posting
```

Only the explicit accounting action should affect booked investment values. Sources: T08, T09.

### WF09 · Model exit proceeds

```text
ERP10 → exit value/date → run → stakeholders/breakpoints → rerun
```

This is analytical modeling, not ERP12 payment authorization. Sources: T10, T12.

### WF10 · Execute a simulated distribution workflow

```text
ERP12 → recipients → banking exceptions → external approval → status tracking
```

In a disconnected recreation, outputs must remain clearly labeled simulation. Sources: T12.

### WF11 · Complete tax workflow

```text
ERP07 → missing-data collection → preparation/review → client signoff → delivery/filing status
```

Preserve the professional review and external filing boundary rather than fabricating a valid filing. Sources: T07.

### WF12 · Aggregate modeled funds

```text
FF26 for an analytical group; FF33 for ownership in a portfolio fund
```

These are different operations: a view is not an investment, and the latter carries cash flows. Sources: F26, F33.

## 6. Calculation model and non-negotiable separations

### Construction is probabilistic allocation modeling

The documented construction engine works with expected cash flows at allocation level, rather than generating pretend individual portfolio companies. Deployable capital reflects the fund’s construction inputs; stage probabilities affect expected follow-ons and outcomes; cash flows feed the distribution model and performance analysis. Actual investments are modeled separately. This establishes the structure of a model, not every proprietary equation or solver. Sources: F28, F05, F04.

### Metric definitions need a common basis

For a matched LP-level basis: DPI = distributions / paid-in capital; RVPI = residual value / paid-in capital; TVPI = (distributions + residual value) / paid-in capital, hence TVPI = DPI + RVPI. Carta’s educational references provide this cross-check. Gross/net, carry, cash, borrowing and timing conventions still require explicit product-level confirmation. Sources: M01, M02.

The retrieved Forecasting metrics text contains operators that conflict with those definitions. This may be a source/rendering/transcription issue; it does not establish that the actual application calculates incorrectly. Do not implement the suspicious extracted expressions. Sources: F30, M01.

### Do not generalize one waterfall to every surface

There are separate objects for fund distribution terms, a portfolio investment’s liquidation preferences, a multi-entity exit model, and GP member carry/vesting. Their inputs and recipients differ. Likewise, a forecasted distribution, a booked distribution and an executed bank payment are different states. Sources: F08, F32, T10, T11, T12.

### Refresh and concurrency are product behaviors

The warehouse developer reference lists many tables on a ten-minute refresh cadence and selected cohort tables on a daily noon-ET cadence, with last_refreshed_at indicating the actual update. This is not proof that every native transactional screen has the same delay. The Forecasting technical guide separately warns about last-save-wins concurrent editing. Do not invent instant global synchronization or collaborative conflict-free editing. Sources: D01, F29.

## 7. Conceptual data relationships for a recreation

The following is a proposed application design derived from documented relationships. It is not a recovered Carta database, API contract or proprietary schema. Public warehouse tables are analytical representations and need not match transactional storage.

| Object group | Relationship / rule | Evidence |
| --- | --- | --- |
| Firm / legal entity / user grant | Firm owns scoped entities; grants limit user and module access. | I — conceptual modeling; T01, T06, F25 |
| Company / security / investment / event | A company can have financing history; a fund investment has its own owned position and dated events. | I — relationships grounded in documents, not private schema; F15, F16, I01 |
| Fund configuration / allocation / sector profile | Construction assumptions are versionable model inputs, separate from real transactions. | I — proposed implementation structure; F02, F04, F05 |
| Investment case / fund scenario | Case holds an investment’s alternative path; scenario changes selected assumptions across a fund. | I — separate objects recommended; F17, F18 |
| Investor / commitment / closing package / disclosure policy | One investor may hold interests in several funds and see a policy-filtered subset of records. | I — linked record design; T03, T04, T06 |
| Capital activity / investor allocation / journal entry | Carta’s public warehouse update documents fund-level activity, LP-level breakdowns and accounting links. | D — public analytical data relationships, not transactional database schema; R04 |
| Metric definition / period value / submission / source | Keep pending submissions separate from accepted values and their provenance. | I — proposed design of documented workflow; F20, T08, I03 |
| Valuation draft / posted valuation / accounting effect | Separate an analysis artifact from the accounting transaction it may produce. | I — proposed design grounded in explicit posting step; T09 |
| Payment instruction / authorization / transfer status | Store simulated payment progress independently from forecasted distributions. | I — proposed implementation boundary; T12 |
| Document / access grant / extraction / review record | Associate evidence with records; do not assume every document is visible to every user. | I — proposed design; T06, T08, T15 |
| Data snapshot / refreshed-at timestamp | Analytical results should disclose source freshness and avoid masquerading as current transactional state. | I — application recommendation; cadence itself is documented; D01 |

## 8. Acceptance contracts and synthetic fixtures

These are test specifications, not tests executed against Carta. D marks a documented rule; I marks a proposed implementation safeguard. Numbers are synthetic. They are intended to prevent a future recreation from becoming a collection of static dashboards with nonfunctional controls.

### AC01 · Stage-probability guard

Fixture: Enter graduation 60% and exit 50% at one stage.

Expected: Reject the invalid combination; do not create a negative failure probability.

Basis: D — documented constraint. Sources: F04.

### AC02 · Terminal stage

Fixture: Enter a nonzero graduation probability in the last stage.

Expected: Require a terminal stage with no further graduation.

Basis: D. Sources: F04.

### AC03 · Residual failure

Fixture: Use graduation 60%, exit 15%.

Expected: Computed failure is 25%, before any display rounding.

Basis: D + synthetic arithmetic fixture. Sources: F04.

### AC04 · Construction versus actuals

Fixture: Add an actual investment to a fund that already has a construction plan.

Expected: Current Forecast reflects actual deployment; Construction Forecast remains an inception model.

Basis: D. Sources: F10.

### AC05 · Actual cash-flow override

Fixture: Override one monthly expense in the actuals editor.

Expected: Actual reporting changes; the override alone does not replan projected investment count.

Basis: D. Sources: F11.

### AC06 · Nested save

Fixture: Edit a round, close its editor, then save the investment.

Expected: Verify the saved parent contains the edited event after reload. Behavior before parent save must be captured, not guessed.

Basis: D with reload test proposed. Sources: F16.

### AC07 · Scenario isolation

Fixture: Change exit assumptions inside a named scenario.

Expected: Base accounting must not change; recalculate and save actions have distinct, inspectable outcomes.

Basis: D for scenario actions; I for implementation isolation contract. Sources: F18, T09.

### AC08 · Historical mode

Fixture: Choose a historical month, then select Reset to today.

Expected: Metrics use each selected time context; historical records are not overwritten.

Basis: D. Sources: F19.

### AC09 · Pending KPI submission

Fixture: Submit a new KPI while automatic approval is off.

Expected: A pending review is distinct from the accepted metric; accept and reject produce different stored states.

Basis: D. Sources: F20.

### AC10 · KPI auto-approval branch

Fixture: Enable Auto-Approve and submit a valid update.

Expected: Follow the auto-approval branch rather than force a manual-review-only workflow.

Basis: D. Sources: F20.

### AC11 · Scoped published reader

Fixture: Open an LP-specific published dashboard.

Expected: Reader is non-editable and cannot access other LP returns through exports or direct data requests.

Basis: D disclosure; I server-side enforcement requirement. Sources: F24.

### AC12 · LP portal cutoff

Fixture: Set one LP to a historical disclosure cutoff.

Expected: Portal data respects both entity/tab visibility and the financial date policy.

Basis: D. Sources: T06.

### AC13 · Valuation draft versus posting

Fixture: Change a draft valuation and compare booked balances, then post it.

Expected: Only the documented posting step triggers booked valuation effects.

Basis: D workflow; I fixture separation. Sources: T09.

### AC14 · External payment boundary

Fixture: Create a distribution with missing recipient bank details.

Expected: Show the missing-information branch; never report a real transfer in a disconnected environment.

Basis: D exception; I simulation contract. Sources: T12.

### AC15 · Warehouse freshness

Fixture: Display a warehouse-derived value whose snapshot timestamp is older than the current record.

Expected: Expose the snapshot timestamp; do not label the figure as instant live accounting.

Basis: D cadence; I presentation contract. Sources: D01.

### AC16 · Matched-basis performance multiples

Fixture: Synthetic LP fixture: paid in 10, distributions 3, residual value 12; all on the same basis.

Expected: DPI 0.3x; RVPI 1.2x; TVPI 1.5x. These are not observed Carta demo outputs.

Basis: D definitions + synthetic arithmetic. Sources: M01, M02.

### AC17 · Undefined ratios

Fixture: Set paid-in capital to zero.

Expected: Show an explicitly unavailable result rather than Infinity or an invented zero.

Basis: I — recommended numeric safeguard; Carta presentation not verified. Sources: M01.

### AC18 · IRR input quality

Fixture: Use only negative cash flows or an ambiguous sequence with multiple sign changes.

Expected: Surface invalid/ambiguous calculation status rather than fabricate a return. Solver conventions must be specified separately.

Basis: I — recommended numerical safeguard. Proposed requirement; not a claim about observed Carta behavior.

### AC19 · Currency eligibility

Fixture: Create a multi-fund view from vehicles with different fund currencies.

Expected: Do not silently pool the values; the documented feature requires a common currency.

Basis: D. Sources: F26.

### AC20 · FoF versus grouped view

Fixture: Compare adding a portfolio-fund investment to adding a fund to a grouped analytical view.

Expected: Only the investment creates linked investment cash flows.

Basis: D. Sources: F26, F33.

### AC21 · SAFE conversion

Fixture: Model an unconverted instrument, then provide a priced-round conversion outcome.

Expected: Apply the modeled/supplied ownership update; do not treat cap value as fully verified ownership.

Basis: D. Sources: F31.

### AC22 · Relative formula period

Fixture: Rerun a saved formula using a relative prior-year KPI period at a later date.

Expected: Resolve the new relative date instead of freezing the original period.

Basis: D. Sources: F21.

### AC23 · Import provenance

Fixture: Retain one local forecast event while accepting a selected imported event.

Expected: Both selected outcomes remain traceable; do not blindly replace all local history.

Basis: D. Sources: R01.

### AC24 · Concurrent writes

Fixture: Have two authorized editors change the same saved model.

Expected: The guide describes last-save-wins. A safer prototype lock/conflict warning is a deliberate deviation, not claimed parity.

Basis: D documented limitation; I safer alternative. Sources: F29.

### AC25 · Connected-record integrity

Fixture: Rename an investor or company in a synthetic connected record.

Expected: Relevant views use stable IDs, not copied names as identity keys.

Basis: I — recommended implementation integrity test. Proposed requirement; not a claim about observed Carta behavior.

### AC26 · Functional controls

Fixture: Exercise each visible primary action in the recreation.

Expected: It changes state, opens a real destination, produces an output, or clearly explains an unavailable dependency; no decorative dead buttons.

Basis: I — implementation acceptance requirement. Proposed requirement; not a claim about observed Carta behavior.

## 9. Open gaps and source conflicts

The unresolved items below are retained deliberately. None should be converted into confident screen details or finance-engine rules by a downstream model.

### G01 · Authenticated screen coverage — Critical for visual parity

Current evidence limit: No complete current authenticated route/screen capture was achieved.

Evidence needed: Capture each target route at fixed desktop dimensions, with current role/entitlement and an as-of date. Do not invent exact menu order.

### G02 · Screenshots and video frames — Critical for visual parity

Current evidence limit: Most embedded images/video players failed in available tools; a title card or thumbnail is not a verified screen.

Evidence needed: Obtain official downloadable frames or a working authorized browser session. Record viewport, state and source per frame.

### G03 · Chart interactions and actual outputs — Critical for behavior parity

Current evidence limit: The guides identify analytics, but not complete tooltip/legend/drilldown behavior or outputs for a common fixture.

Evidence needed: Run one synthetic dataset through the actual product; capture chart states and underlying output tables.

### G04 · Metrics text inconsistency — Critical for financial fidelity

Current evidence limit: The retrieved Forecasting metrics article contains suspect minus operators; Carta’s educational definitions imply addition for TVPI.

Evidence needed: Use consistent-basis formulas as cross-checks, but verify product-specific fees, debt, cash, timing and gross/net conventions before claiming exact parity.

### G05 · Capital-call recognition timing — Critical for financial fidelity

Current evidence limit: General and PE-specific tours describe different GL timing.

Evidence needed: Confirm notice/receivable recognition and funded-cash entries separately. Do not silently choose a transcript.

### G06 · Preference/waterfall semantics — Critical for financial fidelity

Current evidence limit: Clawback wording and one investment preference label-description pairing are ambiguous.

Evidence needed: Verify original UI and documented legal/economic ordering; test capped/participating and catch-up cases independently.

### G07 · Integration permissions and conflicts — High

Current evidence limit: Overview pages expose branch labels without all detailed substeps.

Evidence needed: Inspect source/target roles, selected imports, overwrites, retry failures, revocation and re-sync behavior.

### G08 · Persist/cancel/delete/import edge states — High

Current evidence limit: Not every module documents drafts, undo, deletes, validation messages, duplicate prevention or import templates.

Evidence needed: Capture empty, dirty, invalid, saving, success, failure and permission-denied states for each implemented flow.

### G09 · Current packaging and regional variants — High

Current evidence limit: US/regional pages and older support plans differ. Some announced capabilities are explicitly future-looking.

Evidence needed: Pin an actual target account/package/version. Do not merge all public features into a purported universal Carta menu.

### G10 · Permission matrix — High

Current evidence limit: Read/write controls, LP disclosure and external-user roles are documented, but not a complete cross-product matrix.

Evidence needed: Verify each persona against each entity/action/export/API path.

### G11 · Published snapshot semantics — High

Current evidence limit: Read-only publishing is documented; exact freshness, revoke/expire behavior is not.

Evidence needed: Compare a published link before/after edits and after access changes.

### G12 · Advanced Forecasting breadth — High

Current evidence limit: FoF/SAFE/preferences are documented; cap-table calculator internals, backsolve, secondary optimization, credit-line edge cases and every API are not exhaustively specified here.

Evidence needed: Expand those individual features only when they enter the intended build scope; do not label index-only features implemented.

### G13 · LP Portfolio Analytics and Loan Operations screens — High

Current evidence limit: Public feature behavior is clearer than complete screen sequence or calculation detail.

Evidence needed: Obtain module-specific tours/captures, not screenshots borrowed from Forecasting or fund admin.

### G14 · Data dictionary completeness — Medium

Current evidence limit: Domain/table index is visible, but the full column dictionary fetch timed out.

Evidence needed: Treat the proposed application model as inferred; do not claim actual transactional database compatibility.

### G15 · External integrations and service execution — Medium

Current evidence limit: Tax filing, compliance checks, entity formation, Ramp and banking involve systems outside a local app.

Evidence needed: Use clearly labeled simulations unless authorized production integrations and professional service processes are actually provided.

### G16 · Limits and concurrent editing — Medium

Current evidence limit: Legacy limits and last-save-wins behavior are documented but not reconfirmed for the intended current account.

Evidence needed: Keep limits configurable and mark any intentionally improved collaboration behavior as a deviation.

## 10. What the eventual prompt can and cannot require

Ready to specify: product boundaries; the documented Forecasting configuration/editing flows; major administrative journeys; separate records for actuals/scenarios/posted accounting; source-aware synchronization; meaningful save/review/post states; and the acceptance contracts in this packet.

Not ready to promise: pixel-identical current screens, every authenticated route, exact chart behavior, complete validation copy, undocumented import/error handling, fully matched financial outputs or production banking/tax/KYC execution.

Recommended build framing: a functionally grounded implementation with explicitly labeled visual assumptions, plus a separate visual-parity workstream once current screens can be captured. A high-fidelity promise should be tied to specific screens, roles and states—not to the broad word “Carta.”

For the later prompt, supply this specification and the structured evidence file together. Require each implemented feature to identify its screen ID and evidence source; require deliberate deviations to be recorded; require unresolved external services to remain simulated. This is a handoff rule, not the final build prompt.

## 11. Visual evidence attempts

These are retrieval leads and limitations, not verified design references. No images in this list were used to infer exact current layouts.

### Forecasting dashboard example

Official asset linked from the Forecasting collection; failed to render.

https://images.ctfassets.net/y88td1zx1ufe/7F1sieqBOiKdS0djmE8sCl/2afffe2ce737d8c7b415d55a7f014041/image_9.png

### Construction screenshot

Official construction-page asset; failed to render.

https://images.ctfassets.net/y88td1zx1ufe/4Cx3XQkvYQJ0ENlVxpMPJ0/797bee932e71f2da392312b684c31d7e/Portfolio_construction_UI_1_-_option_1__1_.png

### Portfolio reporting screenshot

Official monitoring-page asset; failed to render.

https://images.ctfassets.net/y88td1zx1ufe/5kcdIP17l1KtYZLB54amoV/e014211ebd9a141a235a19b9557e4cde/Portfolio_reporting_UI_1__1_.png

### Public published fund example

Linked by the official collection; web fetch failed and Exa returned empty content. Not interacted with.

https://fund-forecasting.app.carta.com/published/LaGarita

### Visual-accounting video poster

A title card was accessible; it does not verify the application layout.

https://embed-ssl.wistia.com/deliveries/09e881e67bcb949ec2e212de9e56dfee.jpg?image_crop_resized=1280x720

### Loan setup screenshot

Official loan page image link discovered; image request failed.

https://images.ctfassets.net/y88td1zx1ufe/3Cw6JS8eReqEm84w8WAvHq/4559541bc057b2bd39180a6fb2d0217c/Feature_-__Security_Master.png

### SPV homepage image

Official SPV page image link discovered; image request failed.

https://images.ctfassets.net/y88td1zx1ufe/1QC5hFEipLZQyZXsSoThhC/0f19ab693edca54f50b76fa1c2667ce4/SPV_hero__3_.png

## 12. Official-source register

All substantive product descriptions above point to these sources. Inspection notes distinguish full written instructions, tour transcripts, index-only evidence and inaccessible media. Publication dates were not invented when pages supplied none. Sources were reviewed during this research pass; public material can still lag an individual customer’s product version.

### P01 · Carta Fund ERP

Product page | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/erp/

### P02 · Fund Forecasting — US product page

Product page | Current public positioning reviewed; packaging differs across regional pages.

https://carta.com/fund-management/fund-forecasting/

### P03 · Fund Forecasting collection

Resource index | Collection reviewed. Its linked public demo did not render in the available tools.

https://carta.com/learn/collections/fund-forecasting/

### P04 · Fund Forecasting support index

Support index | Used to discover individual guides; index entries alone are not proof of detailed behavior.

https://support.carta.com/kb/en/fund-forecasting-support-documents-454012

### F01 · Getting started

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-getting-started-qCMLkFOCXy/Steps/4213414

### F02 · Construction Wizard

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-construction-wizard-tJgZSMGW3r/Steps/4213399

### F03 · General fund settings

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-general-tOsHkbGquN/Steps/4213421

### F04 · Sector profiles

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-sector-profiles-TBstj7GKWa/Steps/4213434

### F05 · Allocations

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-allocations-zUcVV9XXCq/Steps/4213413

### F06 · Fees and expenses

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-fees-expenses-z16waLoaSB/Steps/4213417

### F07 · Exit recycling

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-exit-recycling-4DzfHQFNrN/Steps/4213404

### F08 · Forecasting waterfall

Support guide | Guide reviewed; clawback wording is ambiguous and must not be translated directly into a legal/economic algorithm.

https://support.carta.com/kb/guide/en/portfolio-construction-waterfall-jhBeHU857C/Steps/4213390

### F09 · Limited partners in the forecasting model

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-limited-partners-NFgjB6GXVs/Steps/4213383

### F10 · Construction versus Current Forecast

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-construction-vs-aEQaVHfsO9/Steps/4213429

### F11 · Updating model for actuals

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/advanced-updating-model-for-actuals-7ShL2Az1wl/Steps/4213454

### F12 · Investments table

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-investments-table-gtxD7hR0UN/Steps/4213403

### F13 · Investment reporting metrics

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-investment-reporting-metrics-5DkYsurS7J/Steps/4213386

### F14 · Custom views

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-custom-views-EGSA0LWVuS/Steps/4213415

### F15 · Adding investments

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-adding-investments-B1t9fDAxPr/Steps/4213448

### F16 · Managing rounds and investment events

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-managing-rounds-MvAm83Ubaw/Steps/4213443

### F17 · Performance cases

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-performance-cases-pruXD78PY3/Steps/4213388

### F18 · Scenario Builder

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/advanced-scenario-builder-4woB6taecl/Steps/4213440

### F19 · Time Machine

Support guide | Full written guide retrieved through Exa after direct fetch failed. No live interaction test.

https://support.carta.com/kb/guide/en/portfolio-management-time-machine-PTNfjk6HiS/Steps/4213447

### F20 · KPI Manager

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-kpi-manager-tUkUx40xby/Steps/4213428

### F21 · Custom formulas

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/advanced-custom-formulas-t78blq3KBW/Steps/4213444

### F22 · Optimal reserves ranking

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/insights-optimal-reserves-ranking-ATrWfgRH2I/Steps/4213391

### F23 · Document Center

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-document-center-QAkdo5MZa1/Steps/4213431

### F24 · Publishing

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/sharing-and-administration-publishing-oU0ztW32Ln/Steps/4213425

### F25 · Collaborators

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/sharing-and-administration-collaborators-UpQrFEjF3X/Steps/4213446

### F26 · Multi-fund views

Support guide | Full written guide retrieved through Exa; legacy plan terminology may not match current commercial packaging.

https://support.carta.com/kb/guide/en/advanced-multi-fund-views-RJu7EGdivt/Steps/4213401

### F27 · Multiple currencies

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-multiple-currencies-bUCCkWkbwW/Steps/4213411

### F28 · Construction methodology

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/advanced-construction-methodology-xD9w0H32dm/Steps/4213419

### F29 · Technical limitations

Support guide | Documented limits and last-save-wins behavior reviewed; not confirmed against a current paid account.

https://support.carta.com/kb/guide/en/technical-technical-limitations-UHVWEBoKCr/Steps/4213430

### F30 · How Tactyc metrics are calculated

Support guide | Retrieved formula text contains suspect minus signs. Treat this rendering as ambiguous, not an executable formula specification.

https://support.carta.com/kb/guide/en/portfolio-construction-how-are-tactyc-metrics-calculated-1rj6lCCSEf/Steps/4213433

### F31 · SAFEs and convertible notes

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-management-safes-and-notes-8Ek0gswYB1/Steps/4213398

### F32 · Investment liquidation preferences

Support guide | Read guide. One senior/junior label-description pairing is internally inconsistent; ordering requires confirmation.

https://support.carta.com/kb/guide/en/portfolio-management-liquidation-preferences-MMuhWJuNWf/Steps/4213422

### F33 · Fund of Funds

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/advanced-fund-of-funds-yxYou2TLiO/Steps/4213445

### F34 · Adjusting pacing

Support guide | Official written instructions reviewed; embedded UI images not verified.

https://support.carta.com/kb/guide/en/portfolio-construction-adjusting-pacing-8zxDjxPR1o/Steps/4213452

### I01 · Investments integration

Support guide | Overview and branch labels read. Required-permission and setup substeps were not fully exposed by the page extraction.

https://support.carta.com/kb/guide/en/how-to-use-carta-fund-forecastings-investments-integration-vZn47rttbr/Steps/4190091

### I02 · Fund-admin financials integration

Support guide | Overview read; nested permissions/setup/review branches were not fully exposed.

https://support.carta.com/kb/guide/en/how-to-use-the-carta-financials-and-fund-forecasting-fa-integration-with-carta-NjHjsFUP8d/Steps/4394364

### I03 · Company-financials integration

Support guide | Overview read. Carta RFI/Data Collection is designated source of truth for synced company financials.

https://support.carta.com/kb/guide/en/how-to-use-the-carta-financials-and-fund-forecasting-integration-MBypltXles/Steps/4682740

### R01 · Enhancements to the investments integration

Release note | Keep/select import behavior and source labels reviewed; a coming-soon non-Carta-data statement is not treated as launched.

https://releasenotes.carta.com/enhancements-to-the-carta-fund-forecasting-investments-integration-417dqE

### R02 · Fund Forecasting company data sync

Product update | 29 October 2025 update reviewed; depends on both Data Collection and Forecasting.

https://carta.com/product-updates/fund-forecasting-data-sync/

### R03 · General-ledger data and Fund Forecasting

Product update | Reviewed published description of fund actuals and review workflow; exact field-level conflict resolution remains unverified.

https://carta.com/product-updates/gl-data-fund-forecasting-integration/

### R04 · Capital activity queries in Data Warehouse

Product update | 5 June 2026 update: fund events, investor-level breakdowns, and linked journal entries.

https://carta.com/product-updates/query-capital-activity-data-warehouse/

### R05 · Document queries in Carta CRM

Regional product update | 5 June 2026 update: document-aware CRM queries with source references. Not proof of accuracy in every answer.

https://carta.com/uk/en/product-updates/query-documents-carta-crm/

### T01 · Visual accounting homepage

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/carta-homepage/

### T02 · Deal CRM

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/deal-crm/

### T03 · LP CRM

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/lp-crm/

### T04 · Closings

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/closings/

### T05 · Capital calls

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/capital-calls/

### T06 · LP Portal

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/lp-portal/

### T07 · Fund Tax

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/fund-tax/

### T08 · Data Collection

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/data-collection/

### T09 · Portfolio Valuations

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/portfolio-valuations/

### T10 · Waterfall Modeling

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/waterfall-modeling-web-experience/

### T11 · GP Carry Tracking

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/gp-carry-tracking/

### T12 · Automated Money Movement

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/automated-money-movement/

### T13 · Management Company Administration

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/manco-administration/

### T14 · Integrated expense management with Ramp

Official product-tour transcript | Written tour transcript reviewed. Video playback and individual video frames were not verified.

https://carta.com/explore/fund-erp/integrated-expense-management-ramp/

### T15 · Auditor Portal — private-equity tour

Official product-tour transcript | Full written transcript reviewed through Exa; video frames not inspected.

https://carta.com/explore-erp/private-equity/auditor-portal/

### T16 · KYC Dashboard — private-equity tour

Official product-tour transcript | Full written transcript reviewed through Exa; video frames not inspected.

https://carta.com/explore-erp/private-equity/kyc-dashboard/

### T17 · Data Explorer — private-equity tour

Official product-tour transcript | Full written transcript reviewed; older navigation may differ from current Data Warehouse packaging.

https://carta.com/explore-erp/private-equity/data-explorer/

### T18 · Capital calls — private-equity tour

Official product-tour transcript | Describes GL recognition after full funding; newer general tour describes posting when sent, dated due date. Difference retained as an unresolved issue.

https://carta.com/explore-erp/private-equity/capital-calls/

### P05 · SPV management

Product page | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/fund-management/spv/

### P06 · LP Portfolio Analytics

Product page | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/lp-portfolio-analytics/

### P07 · Loan Operations

Product page | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/fund-management/loan-operations/

### P08 · Deal CRM product description

Product page | Explicitly describes a spreadsheet-style interface. Does not establish a Kanban drag-and-drop workflow.

https://carta.com/fund-management/deal-crm/

### P09 · LP CRM product description

Product page | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/fund-management/fund-administration/lp-crm/

### P10 · Fund Forecasting — UK product page

Regional product page | Standalone/module packaging differs from US page; current account entitlement remains a separate verification task.

https://carta.com/uk/en/fund-management/fund-forecasting/

### D01 · Data Warehouse refresh cadence

Developer documentation | Full cadence reference retrieved. Many tables refresh every 10 minutes; certain cohort tables refresh daily at noon ET. Use last_refreshed_at.

https://docs.carta.com/api-platform/guides/guides/refresh-cadence/

### D02 · Data Warehouse data dictionary

Developer documentation | Search extract verified domain/table index only. Full schema fetch timed out. No claim to have read every column or private application schema.

https://docs.carta.com/api-platform/guides/guides/data-warehouse-schemas/

### M01 · RVPI and related metric formulas

Official educational reference | Explicit formula table provides a cross-check for the malformed Forecasting metrics extraction; not a full specification of Forecasting fee/credit-line conventions.

https://carta.com/learn/private-funds/management/fund-performance/rvpi/

### M02 · TVPI definition

Official educational reference | Official written instructions reviewed; current authenticated UI not inspected.

https://carta.com/learn/private-funds/management/fund-performance/tvpi/
