import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { getSession, lpMaySeeDate } from "@/server/auth/session";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";

export default async function LpFundPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const session = await getSession();
  if (!session?.investorId && session?.persona === "lp") redirect("/lp");
  const investorId = session?.investorId ?? "lp_atlantic";
  const investor = getDb().select().from(schema.investors).where(eq(schema.investors.id, investorId)).get();
  const policy = investor?.disclosurePolicyId
    ? getDb().select().from(schema.disclosurePolicies).where(eq(schema.disclosurePolicies.id, investor.disclosurePolicyId)).get()
    : null;
  const cutoff = policy?.cutoffDate ?? null;
  const commitment = getDb()
    .select()
    .from(schema.commitments)
    .all()
    .find((row) => row.fundId === fundId && row.investorId === investorId);
  if (!commitment) {
    return <Callout tone="warning" title="No interest">This LP has no commitment in the requested fund.</Callout>;
  }
  const investments = getDb()
    .select()
    .from(schema.investments)
    .where(eq(schema.investments.fundId, fundId))
    .all()
    .filter(() => lpMaySeeDate(session!, today(), cutoff));
  const asOf = cutoff && cutoff < today() ? cutoff : today();
  return (
    <div className="space-y-4">
      <PageHeader title={`Holdings · ${fundId}`} description={`Capital account view as of ${asOf}${cutoff ? ` (policy cutoff ${cutoff})` : ""}`} />
      <Panel>
        <DataTable
          columns={["Investment", "Cost", "Residual"]}
          rows={investments.map((row) => {
            const metrics = investmentMetrics(row.id, asOf, false);
            return [row.name, <Money key={`${row.id}-c`} value={metrics.invested} />, <Money key={`${row.id}-u`} value={metrics.unrealized} />];
          })}
        />
      </Panel>
    </div>
  );
}
