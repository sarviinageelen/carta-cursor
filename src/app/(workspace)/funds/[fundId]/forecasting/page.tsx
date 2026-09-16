import Link from "next/link";
import { constructionForecastForFund, currentForecastForFund, monthlyModel } from "@/server/services/forecast";
import { today } from "@/server/clock";
import { Metric, PageHeader, Panel, Callout } from "@/components/ui/panel";
import { Money } from "@/components/money";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export default async function ForecastDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ fundId: string }>;
  searchParams: Promise<{ mode?: string; asOf?: string }>;
}) {
  const { fundId } = await params;
  const { mode = "current", asOf: requested } = await searchParams;
  const asOf = requested || today();
  const construction = constructionForecastForFund(fundId);
  const current = currentForecastForFund(fundId, asOf);
  const selected = mode === "construction" ? construction : current;
  const months = monthlyModel(fundId, mode === "construction" ? "construction" : "current", asOf).slice(0, 18);
  return (
    <div>
      <PageHeader
        title="Forecast analytics"
        description="Construction is the inception model. Current adds actual investments and remaining modeled deployment."
        actions={
          <div className="flex gap-2 text-[13px]">
            <Link href={`?mode=construction${requested ? `&asOf=${requested}` : ""}`} className={mode === "construction" ? "font-medium text-accent" : "text-muted"}>
              Construction Forecast
            </Link>
            <Link href={`?mode=current${requested ? `&asOf=${requested}` : ""}`} className={mode !== "construction" ? "font-medium text-accent" : "text-muted"}>
              Current Forecast
            </Link>
            <Link href={`/funds/${fundId}/forecasting/time-machine`} className="text-muted">
              Time Machine
            </Link>
          </div>
        }
      />
      <Callout title="Selected model">
        Viewing <strong>{mode === "construction" ? "Construction Forecast" : "Current Forecast"}</strong> as of {asOf}. Actual
        investments do not rewrite construction deal counts.
      </Callout>
      <Panel className="mt-4 flex flex-wrap">
        {mode === "construction" && construction?.status === "ok" ? (
          <>
            <Metric label="Projected deals" value={Number(construction.value.projectedDealCount).toFixed(2)} />
            <Metric label="Expected invested" value={<Money value={construction.value.totalExpectedInvested} />} />
            <Metric label="Expected exits" value={<Money value={construction.value.totalExpectedExits} />} />
          </>
        ) : null}
        {mode !== "construction" && current?.status === "ok" ? (
          <>
            <Metric label="Actual invested" value={<Money value={current.value.actualInvested} />} />
            <Metric label="Modeled remaining" value={<Money value={current.value.modeledRemaining} />} />
            <Metric label="Construction deal count (unchanged)" value={Number(current.value.projectedDealCountUnchangedFromConstruction).toFixed(2)} />
          </>
        ) : null}
        {selected && selected.status !== "ok" ? <Metric label="Status" value="Unavailable" hint={selected.message} /> : null}
      </Panel>
      <Panel className="mt-4">
        <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
          Deployment pacing (table alternative to the chart)
        </div>
        <DataTable
          columns={["Month", "Kind", "Initial deployment"]}
          rows={months.map((row) => [row.month, <Badge key={row.month}>{row.kind}</Badge>, <Money key={`${row.month}-a`} value={row.initial} />])}
        />
      </Panel>
    </div>
  );
}
