import Link from "next/link";
import { eq } from "drizzle-orm";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Metric, PageHeader, Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { getDb, schema } from "@/server/db";
import { accountNet, creditNormalBalance } from "@/server/services/accounting";
import { today } from "@/server/clock";
import { currentForecastForFund } from "@/server/services/forecast";
import { performanceMultiples } from "@/domain/metrics";
import { multiple } from "@/components/money";

export default async function HomePage() {
  const db = getDb();
  const funds = db.select().from(schema.legalEntities).where(eq(schema.legalEntities.firmId, "firm_northbridge")).all();
  const tasks = [
    { label: "KPI pending review", href: "/data-collection", tone: "warning" as const },
    { label: "Draft Harborline valuation", href: "/valuations", tone: "info" as const },
    { label: "Distribution blocked — missing bank details", href: "/funds/fund_nb_ii/operations/distributions", tone: "danger" as const },
    { label: "Helios SPV banking (simulated)", href: "/spvs", tone: "info" as const },
  ];
  const asOf = today();
  const nav = accountNet("fund_nb_ii", "1400", asOf);
  const cash = accountNet("fund_nb_ii", "1000", asOf);
  const paidIn = creditNormalBalance("fund_nb_ii", "3200", asOf);
  const distributions = accountNet("fund_nb_ii", "3300", asOf);
  const current = currentForecastForFund("fund_nb_ii", asOf);
  const multiples = performanceMultiples({
    paidIn,
    distributions,
    residualValue: nav,
  });
  const companies = db.select().from(schema.companies).all();
  const entities = funds.map((fund) => ({
    id: fund.id,
    name: fund.name,
    kind: fund.kind,
    currency: fund.currency,
    commitments: fund.commitments,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Firm overview"
        title="Northbridge Capital"
        description="Operational home for the synthetic firm. Totals are derived from the shared ledger and forecast services, not hardcoded dashboard constants."
      />
      <Panel className="mb-4 flex flex-wrap">
        <Metric label="Fund II cash" value={<Money value={cash} />} hint="As-of demo clock" />
        <Metric label="Fund II investments FV" value={<Money value={nav} />} hint="Posted valuations only" />
        <Metric
          label="Fund II TVPI"
          value={multiples.status === "ok" ? multiple(multiples.value.tvpi) : "n/a"}
          hint="Matched LP basis"
        />
        <Metric
          label="Current forecast remaining"
          value={current?.status === "ok" ? <Money value={current.value.modeledRemaining} /> : "n/a"}
          hint="Does not rewrite construction"
        />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">Open work</div>
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.label} className="flex items-center justify-between px-4 py-2.5">
                <span>{task.label}</span>
                <Link href={task.href} className="text-[12px] text-accent">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">Legal entities</div>
          <DataTable
            columns={["Entity", "Kind", "Currency", "Commitments"]}
            rows={entities.map((entity) => [
              <Link key={entity.id} href={entity.kind === "fund" || entity.kind === "spv" ? `/funds/${entity.id}` : "/management-company"} className="text-accent">
                {entity.name}
              </Link>,
              <Badge key={`${entity.id}-k`}>{entity.kind}</Badge>,
              entity.currency,
              <Money key={`${entity.id}-c`} value={entity.commitments} />,
            ])}
          />
        </Panel>
      </div>
      <Panel className="mt-4">
        <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
          Entity graph (table alternative)
        </div>
        <DataTable
          columns={["From", "Relationship", "To"]}
          rows={[
            ["Northbridge GP", "manages", "Ventures I / II / Ridgeway / Helios SPV"],
            ["Ventures II", "owns", "Lumenforge, Harborline, Nimbus, Wren SAFE, Ridgeway FoF"],
            ["Ventures I", "owns", "Lumenforge (shared company), Keel (realized), Pinecone (write-off)"],
            ["LPs", "commit to", "Ventures I / II — disclosure-scoped in LP Portal"],
          ].map((row) => row)}
        />
        <p className="px-4 py-2 text-[12px] text-muted">
          Shared company exposure is one company record with two investment IDs. Grouped multi-fund views do not create ownership.
        </p>
      </Panel>
      <p className="mt-3 text-[12px] text-muted">{companies.length} portfolio companies in the firm graph.</p>
    </div>
  );
}
