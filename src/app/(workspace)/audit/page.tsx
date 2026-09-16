import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getSession } from "@/server/auth/session";

export default async function AuditPage() {
  const session = await getSession();
  const engagements = getDb().select().from(schema.auditEngagements).all();
  const evidence = getDb().select().from(schema.auditEvidence).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Audit" description="Evidence assembly from connected records. Auditors can inspect, not alter fund economics." />
      {session?.persona === "auditor" ? <Callout title="Auditor scope">Read-only evidence. Posting and investment edits are disabled for this persona.</Callout> : null}
      <Panel>
        <DataTable columns={["Entity", "Year", "Status"]} rows={engagements.map((row) => [row.entityId, String(row.year), row.status])} />
      </Panel>
      <Panel>
        <DataTable columns={["Category", "Related", "Status"]} rows={evidence.map((row) => [row.category, `${row.relatedType}:${row.relatedId}`, row.status])} />
      </Panel>
    </div>
  );
}
