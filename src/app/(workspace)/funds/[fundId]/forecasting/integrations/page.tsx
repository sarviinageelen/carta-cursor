import { acceptIntegrationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function ForecastIntegrationsPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const records = getDb().select().from(schema.integrationRecords).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Integration review" description="Three distinct simulated flows: investment events, fund-admin actuals, and company financials/KPIs." />
      <Callout title="Vehicle">{fundId} · Reimporting the same sourceRecordId is idempotent. Local forecast events are retained unless replacement is chosen.</Callout>
      <Panel>
        <DataTable
          columns={["Source ID", "Payload", "Decision", "Action"]}
          rows={records.map((row) => [
            row.sourceRecordId,
            row.payloadJson,
            row.decision,
            <form key={row.id} action={acceptIntegrationAction} className="flex items-center gap-2">
              <input type="hidden" name="recordId" value={row.id} />
              <label className="text-[12px]">
                <input type="checkbox" name="keepLocal" defaultChecked /> Keep local events
              </label>
              <Button variant="secondary">Accept selected</Button>
            </form>,
          ])}
        />
      </Panel>
    </div>
  );
}
