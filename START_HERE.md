# Carta Fund ERP — Cursor build kit

Prepared 16 September 2026. This kit contains prompts and research, not an already-built application.

## Use it

For a new project, extract this kit and open the extracted folder in Cursor. It is intentionally a research/brief folder without an application scaffold; the agent will create the Next.js project in place.

For an existing project, merge `prompts/`, `docs/carta/`, and the new `.cursor/rules/carta-fund-erp.mdc` file into the project root without overwriting existing instructions or code. The `.cursor` directory is a hidden directory on some systems; ensure it is included.

In Cursor Agent, use your chosen Claude Opus 5 / High setting. Paste the text from `prompts/START_IN_CURSOR.txt`. Resolve the file mentions in Cursor, or attach the named files, so the agent can read them. Alternatively, paste the full contents of `prompts/BUILD_CARTA_FUND_ERP.md` with the research files available in the repository.

The model setting belongs in Cursor. The prompt does not require a model API key or an Anthropic/AI integration in the app itself. Respect Cursor's tool and command permissions; do not enable unrestricted destructive operations to satisfy the prompt.

## What you are asking it to build

A locally runnable, persistent, synthetic-data Next.js prototype of the connected Fund ERP experience. Forecasting receives the deepest requirements, but CRM, fundraising, capital activity, portfolio monitoring/valuations, tax/audit/KYC workflows, the LP Portal, SPVs, management-company operations, allocator analytics and loan operations remain in scope.

Local record editing, calculations, saves, reviews, approvals, reporting, permissions and navigation must work. Banking, email delivery, signatures, filings, screening, formation, live synchronization and unconnected model calls are explicitly simulated. The result is not specified as production banking/tax/compliance software or a pixel-identical copy of Carta.

## Files

| File | Purpose |
| --- | --- |
| `prompts/START_IN_CURSOR.txt` | Short message to paste into Cursor, referring to the repository files. |
| `prompts/BUILD_CARTA_FUND_ERP.md` | Complete implementation prompt: scope, architecture, screens, behavior, data, calculations, design, milestones, tests and handoff. |
| `.cursor/rules/carta-fund-erp.mdc` | Compact always-applied project guardrails. |
| `docs/carta/carta_fund_erp_research.md` | Unmodified research specification from the previous step. |
| `docs/carta/carta_fund_erp_evidence.json` | Unmodified structured product evidence. |
| `docs/carta/carta_fund_erp_research.html` | Optional readable research report, not a visual reference for the application. |
| `docs/carta/implementation_tracker.json` | Initial feature/workflow/test coverage; all entries start not implemented or not run. |
| `docs/carta/TECHNICAL_REFERENCES.md` | Official engineering and prompting references reviewed when writing this kit. |
| `prompts/RESUME_IN_CURSOR.txt` | Resume an interrupted build using actual repository status rather than rebuilding from scratch. |

## Expectations and evidence limits

The research organizes 53 screen/view/editor families, 12 workflows and 26 acceptance contracts. These are a requirements inventory, not already-implemented pages or executed tests. All original product evidence IDs are preserved.

The source packet contains no complete current authenticated screens marked visually verified. Proposed layouts, routes, schemas, demo roles and supported calculation profiles in the build prompt are implementation decisions. Unresolved financial conventions must be documented and tested within a named supported profile, rather than claimed to reproduce Carta's private engine.

This is a multi-milestone build. A single initial instruction does not guarantee an agent will finish the entire scope in one session. The prompt therefore requires runnable checkpoints and explicit coverage. When a session stops, use `prompts/RESUME_IN_CURSOR.txt`; do not ask the agent to regenerate the application from zero.

## Handoff you should expect from the coding agent

A working repository with setup instructions, migrations/seed data, coherent demo journeys, actual test results, a feature coverage tracker, screenshots it has inspected, and a clear list of unsupported or unfinished behavior. The creation of this kit does not mean those implementation checks have already been run.
