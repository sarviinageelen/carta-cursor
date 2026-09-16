import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Money } from "@/components/money";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function InvestorDetailPage({ params }: { params: Promise<{ investorId: string }> }) {
  const { investorId } = await params;
  const investor = getDb().select().from(schema.investors).where(eq(schema.investors.id, investorId)).get();
  if (!investor) notFound();
  const commitments = getDb().select().from(schema.commitments).where(eq(schema.commitments.investorId, investorId)).all();
  const closings = getDb().select().from(schema.closings).where(eq(schema.closings.investorId, investorId)).all();
  const interactions = getDb().select().from(schema.interactions).all().filter((row) => row.investorId === investorId);
  return (
    <div className="space-y-4">
      <PageHeader title={investor.name} description={`${investor.type} · disclosure ${investor.disclosurePolicyId ?? "default"}`} />
      <Panel>
        <DataTable
          columns={["Fund", "Amount", "Status"]}
          rows={commitments.map((row) => [row.fundId, <Money key={row.id} value={row.amount} />, row.status])}
        />
      </Panel>
      <Panel>
        <DataTable columns={["Closing", "Status", "Legal commitment"]} rows={closings.map((row) => [row.id, row.status, row.legalCommitment ?? "—"])} />
      </Panel>
      <Panel>
        <DataTable columns={["Interaction", "Subject"]} rows={interactions.map((row) => [row.occurredAt, row.subject])} />
      </Panel>
      <Callout title="Economics">Paid-in and NAV are not editable on this CRM record.</Callout>
    </div>
  );
}
