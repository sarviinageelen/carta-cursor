import Link from "next/link";
import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";

export default async function InvestorsPage() {
  const investors = getDb().select().from(schema.investors).all();
  const commitments = getDb().select().from(schema.commitments).all();
  return (
    <div className="space-y-4">
      <PageHeader title="LP CRM" description="Relationship workspace. Commitments and performance are sourced from administration records, not independently edited here." />
      <Callout title="Boundary">Do not treat CRM as a second general ledger. Closed legal commitments live on the commitment table.</Callout>
      <Panel>
        <DataTable
          columns={["Investor", "Stage", "KYC", "Commitments", "Bank"]}
          rows={investors.map((row) => [
            <Link key={row.id} className="text-accent" href={`/crm/investors/${row.id}`}>
              {row.name}
            </Link>,
            row.fundraisingStage,
            <Badge key={`${row.id}-k`}>{row.kycStatus}</Badge>,
            commitments.filter((item) => item.investorId === row.id).length,
            row.bankDetailsConfirmed ? "confirmed" : "missing",
          ])}
        />
      </Panel>
    </div>
  );
}
