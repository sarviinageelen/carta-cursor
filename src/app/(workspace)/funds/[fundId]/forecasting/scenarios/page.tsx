import { eq } from "drizzle-orm";
import { recalculateScenarioAction, saveScenarioAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { DataTable } from "@/components/data-table";
import { Money, money } from "@/components/money";
import { getDb, schema } from "@/server/db";
import { currentForecastForFund } from "@/server/services/forecast";
import { today } from "@/server/clock";

type ScenarioResult = {
  baseline?: {
    actualInvested: string;
    modeledRemaining: string;
    actualUnrealized: string;
    projectedDealCountUnchangedFromConstruction: string;
  };
  scenario?: {
    actualInvested: string;
    modeledRemaining: string;
    actualUnrealized: string;
    projectedDealCountUnchangedFromConstruction: string;
  } | null;
  applied?: Record<string, unknown>;
  note?: string;
};

export default async function ScenariosPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const scenarios = getDb().select().from(schema.fundScenarios).where(eq(schema.fundScenarios.fundId, fundId)).all();
  const baseline = currentForecastForFund(fundId, today());
  const liveBaseline = baseline?.status === "ok" ? baseline.value : null;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Scenario Builder"
        description="A scenario overlays selected assumptions. Recalculate and Save are distinct. There is no Apply-to-base action."
      />
      <Callout title="Baseline isolation">
        Baseline current-forecast remaining {liveBaseline ? money(liveBaseline.modeledRemaining) : "n/a"}. Scenario edits
        do not mutate construction, actual investments, or posted journals.
      </Callout>
      {liveBaseline ? (
        <Panel className="flex flex-wrap">
          <Metric label="Baseline remaining" value={<Money value={liveBaseline.modeledRemaining} />} />
          <Metric label="Baseline unrealized" value={<Money value={liveBaseline.actualUnrealized} />} />
          <Metric label="Construction deal count" value={Number(liveBaseline.projectedDealCountUnchangedFromConstruction).toFixed(2)} />
        </Panel>
      ) : null}
      {scenarios.map((scenario) => {
        const parsed = scenario.resultJson ? (JSON.parse(scenario.resultJson) as ScenarioResult) : null;
        return (
          <Panel key={scenario.id} className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-medium">{scenario.name}</h2>
              <Badge>{scenario.status}</Badge>
              <Badge tone={scenario.stale ? "warning" : "success"}>{scenario.stale ? "stale vs inputs" : "current"}</Badge>
              <form action={recalculateScenarioAction}>
                <input type="hidden" name="scenarioId" value={scenario.id} />
                <input type="hidden" name="fundId" value={fundId} />
                <Button type="submit" variant="secondary">
                  Recalculate
                </Button>
              </form>
            </div>
            {parsed?.scenario && parsed.baseline ? (
              <DataTable
                columns={["Metric", "Baseline Current Forecast", "Scenario overlay"]}
                rows={[
                  [
                    "Modeled remaining",
                    <Money key={`${scenario.id}-br`} value={parsed.baseline.modeledRemaining} />,
                    <Money key={`${scenario.id}-sr`} value={parsed.scenario.modeledRemaining} />,
                  ],
                  [
                    "Unrealized (haircut overlay)",
                    <Money key={`${scenario.id}-bu`} value={parsed.baseline.actualUnrealized} />,
                    <Money key={`${scenario.id}-su`} value={parsed.scenario.actualUnrealized} />,
                  ],
                  [
                    "Construction deal count",
                    Number(parsed.baseline.projectedDealCountUnchangedFromConstruction).toFixed(2),
                    Number(parsed.scenario.projectedDealCountUnchangedFromConstruction).toFixed(2),
                  ],
                  ["Actual invested (unchanged)", <Money key={`${scenario.id}-bi`} value={parsed.baseline.actualInvested} />, <Money key={`${scenario.id}-si`} value={parsed.scenario.actualInvested} />],
                ]}
              />
            ) : (
              <p className="text-[13px] text-muted">Not yet recalculated. Recalculate stores an overlay comparison without writing journals.</p>
            )}
            <p className="mt-2 text-[12px] text-muted">{parsed?.note ?? JSON.stringify(JSON.parse(scenario.overridesJson))}</p>
          </Panel>
        );
      })}
      <Panel className="p-4">
        <h2 className="mb-2 font-medium">Create scenario</h2>
        <form action={saveScenarioAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Name</Label>
          <Input name="name" required />
          <Label>Assumption note</Label>
          <Input name="note" placeholder="e.g. delay exits 12 months" />
          <Label>Follow-on remaining boost (0.25 = +25%)</Label>
          <Input name="followOnBoost" defaultValue="0" />
          <Label>Remaining multiplier (overrides boost when not 1)</Label>
          <Input name="remainingMultiplier" defaultValue="1" />
          <Label>Exit haircut (0.10 = −10% unrealized)</Label>
          <Input name="exitHaircut" defaultValue="0" />
          <Label>Exit delay (months, labeled only)</Label>
          <Input name="exitDelayMonths" defaultValue="0" />
          <Button type="submit">Save scenario</Button>
        </form>
      </Panel>
    </div>
  );
}
