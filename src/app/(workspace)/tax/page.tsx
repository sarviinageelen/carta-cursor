import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";

export default async function TaxPage() {
  const years = getDb().select().from(schema.taxYears).all();
  const tasks = getDb().select().from(schema.taxTasks).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Fund Tax" description="Workflow statuses only. Generated documents are samples, not valid filings." />
      <Callout tone="warning" title="External boundary">No CPA is engaged and nothing is e-filed. Estimate vs final documents remain distinct.</Callout>
      <Panel>
        <DataTable
          columns={["Entity", "Year", "Status", "Estimate", "Final"]}
          rows={years.map((row) => [row.entityId, String(row.year), <Badge key={row.id}>{row.status}</Badge>, row.estimateDocumentId ?? "—", row.finalDocumentId ?? "none — sample not filed"])}
        />
      </Panel>
      <Panel>
        <DataTable columns={["Task", "Kind", "Status"]} rows={tasks.map((row) => [row.title, row.kind, row.status])} />
      </Panel>
    </div>
  );
}
