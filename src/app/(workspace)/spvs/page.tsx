import { advanceSpvStepAction } from "@/app/actions";
import { getDb, schema } from "@/server/db";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";

export default async function SpvPage() {
  const formations = getDb().select().from(schema.spvFormations).all();
  return (
    <div className="space-y-4">
      <PageHeader title="SPV formation" description="Guided checklist with simulated formation/banking milestones. This is not evidence a real entity has been formed." />
      <Callout tone="warning" title="Legal boundary">
        The forecasting no-construction switch is a different concept from this formation workflow.
      </Callout>
      {formations.map((row) => {
        const items = JSON.parse(row.checklistJson) as Array<{ id: string; label: string; status: string; simulated: boolean }>;
        return (
          <Panel key={row.id}>
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <div>
                {row.entityId} · <Badge>{row.status}</Badge>
              </div>
              <form action={advanceSpvStepAction}>
                <input type="hidden" name="formationId" value={row.id} />
                <Button variant="secondary">Simulate next milestone</Button>
              </form>
            </div>
            <DataTable
              columns={["Step", "Status", "Simulated"]}
              rows={items.map((item) => [item.label, item.status, item.simulated ? "yes" : "local"])}
            />
          </Panel>
        );
      })}
    </div>
  );
}
