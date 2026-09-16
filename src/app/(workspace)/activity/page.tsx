import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui/panel";

export default async function ActivityPage() {
  const log = getDb().select().from(schema.auditLog).all();
  const mail = getDb().select().from(schema.outboxMessages).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Activity" description="Audit log and simulated outbox. Mail is never sent." />
      <Panel>
        <DataTable
          columns={["When", "Action", "Entity"]}
          rows={log.length ? log.map((row) => [row.createdAt, row.action, `${row.entityType}:${row.entityId}`]) : [["—", "No audit rows seeded", "—"]]}
        />
      </Panel>
      <Panel>
        <DataTable columns={["Outbox", "To", "Status"]} rows={mail.map((row) => [row.subject, row.toAddress, row.status])} />
      </Panel>
    </div>
  );
}
