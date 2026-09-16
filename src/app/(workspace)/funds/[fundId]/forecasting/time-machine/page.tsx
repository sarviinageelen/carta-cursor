import Link from "next/link";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money, multiple } from "@/components/money";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { currentForecastForFund, constructionForecastForFund } from "@/server/services/forecast";
import { investmentMetrics } from "@/server/services/investments";
import { balancesAsOf } from "@/server/services/accounting";
import { today } from "@/server/clock";

export default async function TimeMachinePage({
  params,
  searchParams,
}: {
  params: Promise<{ fundId: string }>;
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { fundId } = await params;
  const { asOf: requested } = await searchParams;
  const clock = today();
  const asOf = requested || clock;
  const historical = asOf < clock;
  const construction = constructionForecastForFund(fundId);
  const current = currentForecastForFund(fundId, asOf);
  const investments = getDb().select().from(schema.investments).where(eq(schema.investments.fundId, fundId)).all();
  const nav = balancesAsOf(fundId, asOf).find((row) => row.accountCode === "1400");
  return (
    <div className="space-y-4">
      <PageHeader
        title="Time Machine"
        description="Recalculate Current Forecast, investment metrics, and posted NAV as of a historical date. Stored events and journals are not rewritten."
      />
      <form className="flex flex-wrap items-end gap-2">
        <div>
          <Label>As of</Label>
          <Input type="date" name="asOf" defaultValue={asOf} />
        </div>
        <Button variant="secondary">Recalculate historically</Button>
        {historical ? (
          <Link href="?" className="text-[13px] text-accent">
            Reset to demo clock {clock}
          </Link>
        ) : null}
      </form>
      {historical ? (
        <Callout tone="warning" title="Read-only historical view">
          Viewing {asOf}. This does not change construction, investment events, or posted journals. Demo clock remains {clock}.
        </Callout>
      ) : (
        <Callout title="Current as-of">Aligned to the demo clock {clock}.</Callout>
      )}
      <Panel className="flex flex-wrap">
        <Metric
          label="Construction deals (inception)"
          value={construction?.status === "ok" ? Number(construction.value.projectedDealCount).toFixed(2) : "n/a"}
        />
        <Metric
          label="Actual invested as-of"
          value={current?.status === "ok" ? <Money value={current.value.actualInvested} /> : "n/a"}
        />
        <Metric label="Posted investments FV" value={<Money value={nav?.net ?? "0"} />} hint="Journals with effective date ≤ as-of" />
      </Panel>
      <Panel>
        <DataTable
          columns={["Investment", "Invested ≤ as-of", "Unrealized", "Realized", "MOIC"]}
          rows={investments.map((investment) => {
            const metrics = investmentMetrics(investment.id, asOf, false);
            return [
              <Link key={investment.id} className="text-accent" href={`/funds/${fundId}/forecasting/investments/${investment.id}`}>
                {investment.name}
              </Link>,
              <Money key={`${investment.id}-i`} value={metrics.invested} />,
              <Money key={`${investment.id}-u`} value={metrics.unrealized} />,
              <Money key={`${investment.id}-r`} value={metrics.realized} />,
              metrics.moic?.status === "ok" ? multiple(metrics.moic.value) : "n/a",
            ];
          })}
        />
      </Panel>
    </div>
  );
}
