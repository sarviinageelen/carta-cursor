import { changeWaterfallInputsAction, runWaterfallAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function WaterfallsPage() {
  const models = getDb().select().from(schema.waterfallModels).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Multi-entity waterfall" description="Analytical modeling only. Running this does not authorize bank payments." />
      {models.map((model) => {
        const run = model.lastRunJson ? JSON.parse(model.lastRunJson) : null;
        const proceeds = run?.result?.status === "ok" ? run.result.value.proceeds : [];
        return (
          <Panel key={model.id} className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-medium">{model.name}</h2>
              <Badge tone={model.stale ? "warning" : "success"}>{model.stale ? "stale — rerun required" : "current"}</Badge>
            </div>
            <form action={runWaterfallAction} className="mb-3 flex flex-wrap gap-2">
              <input type="hidden" name="modelId" value={model.id} />
              <Label>Exit value</Label>
              <Input name="exitValue" defaultValue="40000000" className="w-40" />
              <Label>Exit date</Label>
              <Input type="date" name="exitDate" defaultValue="2026-09-16" className="w-40" />
              <Button type="submit">Run</Button>
            </form>
            <form action={changeWaterfallInputsAction}>
              <input type="hidden" name="modelId" value={model.id} />
              <Button variant="secondary">Mark inputs changed</Button>
            </form>
            <DataTable
              columns={["Stakeholder", "Amount", "Path"]}
              rows={proceeds.map((row: { name: string; amount: string; path: string[] }) => [
                row.name,
                <Money key={row.name} value={row.amount} />,
                row.path.join(" → "),
              ])}
            />
          </Panel>
        );
      })}
      <Callout title="Separation">Use Distributions to request simulated payments. Those records are independent of this model run.</Callout>
    </div>
  );
}
