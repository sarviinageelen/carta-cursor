import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cloneCaseAction } from "@/app/actions";
import { InvestmentEditor } from "@/components/investment-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { Money, multiple } from "@/components/money";
import { getDb, schema } from "@/server/db";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ fundId: string; investmentId: string }>;
}) {
  const { fundId, investmentId } = await params;
  const investment = getDb().select().from(schema.investments).where(eq(schema.investments.id, investmentId)).get();
  if (!investment) notFound();
  const fund = getDb().select().from(schema.legalEntities).where(eq(schema.legalEntities.id, fundId)).get();
  const metrics = investmentMetrics(investmentId, today(), false);
  const cases = getDb().select().from(schema.investmentCases).where(eq(schema.investmentCases.investmentId, investmentId)).all();
  const prefs = metrics.caseId
    ? getDb().select().from(schema.investmentLiqPrefs).where(eq(schema.investmentLiqPrefs.caseId, metrics.caseId)).all()
    : [];
  return (
    <div className="space-y-4">
      <PageHeader
        title={investment.name}
        description="Investment performance cases belong to this investment. Fund scenarios are separate. Nested event edits persist only through Save Changes."
      />
      <Panel className="flex flex-wrap">
        <Metric label="Invested" value={<Money value={metrics.invested} />} />
        <Metric label="Unrealized" value={<Money value={metrics.unrealized} />} />
        <Metric label="Realized" value={<Money value={metrics.realized} />} />
        <Metric label="Gross MOIC" value={metrics.moic?.status === "ok" ? multiple(metrics.moic.value) : "n/a"} />
      </Panel>
      {investment.name.includes("Wren") ? (
        <Callout tone="warning" title="SAFE / note">
          Cap value is not treated as verified ownership. Supply a conversion outcome or priced-round ownership update.
        </Callout>
      ) : null}
      {investment.portfolioFundId ? (
        <Callout title="Fund of funds">
          Parent participation {investment.fofAmount} sourced from {investment.fofSourceForecast} forecast of {investment.portfolioFundId}. This creates linked cash flows; a grouped view does not.
        </Callout>
      ) : null}
      <Panel className="p-4">
        <h2 className="mb-2 font-medium">Cases</h2>
        <div className="mb-3 flex gap-2">
          {cases.map((row) => (
            <Badge key={row.id} tone={row.isBase ? "accent" : "neutral"}>
              {row.name} · {row.probability}
            </Badge>
          ))}
        </div>
        {cases[0] ? (
          <form action={cloneCaseAction} className="flex max-w-lg items-end gap-2">
            <input type="hidden" name="fundId" value={fundId} />
            <input type="hidden" name="investmentId" value={investmentId} />
            <input type="hidden" name="caseId" value={cases[0].id} />
            <Input name="name" defaultValue="Downside clone" />
            <Button variant="secondary">Clone case</Button>
          </form>
        ) : null}
        <p className="mt-2 text-[12px] text-muted">Cases belong to this investment. Fund Scenario Builder is a separate overlay.</p>
      </Panel>
      {prefs.length ? (
        <Panel className="p-4 text-[13px]">
          Liquidation preferences (investment stack, not the fund waterfall):{" "}
          {prefs.map((pref) => `${pref.name} seniority ${pref.seniority} ${pref.type}`).join("; ")}
        </Panel>
      ) : null}
      {metrics.caseId ? (
      <InvestmentEditor
        fundId={fundId}
        investmentId={investmentId}
        caseId={metrics.caseId}
        version={investment.version}
        inceptionDate={fund?.inceptionDate ?? null}
        events={metrics.events.map((event) => ({
          id: event.id,
          kind: event.kind,
          date: event.date,
          amount: event.amount,
          ownership: event.ownership,
          isProjected: event.isProjected,
          notes: event.notes,
          securityType: event.securityType,
        }))}
      />
      ) : null}
    </div>
  );
}
