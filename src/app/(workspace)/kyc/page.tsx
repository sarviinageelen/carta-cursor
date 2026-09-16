import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";

export default async function KycPage() {
  const cases = getDb().select().from(schema.kycCases).all();
  const investors = getDb().select().from(schema.investors).all();
  return (
    <div className="space-y-4">
      <PageHeader title="KYC" description="Synthetic screening results. A flag is a review task, not an accusation." />
      <Callout title="Simulation">No identity vendor is connected. CDD reports are fixtures.</Callout>
      <Panel>
        <DataTable
          columns={["Investor", "Status", "Screening", "Flagged"]}
          rows={cases.map((row) => [
            investors.find((item) => item.id === row.investorId)?.name ?? row.investorId,
            <Badge key={row.id} tone={row.flagged ? "warning" : "success"}>
              {row.status}
            </Badge>,
            row.screeningResult,
            row.flagged ? "review task" : "no",
          ])}
        />
      </Panel>
    </div>
  );
}
