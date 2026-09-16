import { acceptIntegrationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function IntegrationsPage() {
  const batches = getDb().select().from(schema.integrationBatches).all();
  const records = getDb().select().from(schema.integrationRecords).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Integrations" description="Simulated investment-event, fund-admin, and company-financials review batches." />
      <Callout title="No live Carta/Ramp connection">Preview, mapping, selective acceptance, provenance, and idempotent source IDs only.</Callout>
      <Panel>
        <DataTable columns={["Kind", "Source", "Status"]} rows={batches.map((row) => [row.kind, row.source, row.status])} />
      </Panel>
      <Panel>
        <DataTable
          columns={["Source record", "Decision", "Action"]}
          rows={records.map((row) => [
            row.sourceRecordId,
            row.decision,
            <form key={row.id} action={acceptIntegrationAction}>
              <input type="hidden" name="recordId" value={row.id} />
              <label className="mr-2 text-[12px]">
                <input type="checkbox" name="keepLocal" defaultChecked /> keep local
              </label>
              <Button variant="secondary">Accept</Button>
            </form>,
          ])}
        />
      </Panel>
    </div>
  );
}
