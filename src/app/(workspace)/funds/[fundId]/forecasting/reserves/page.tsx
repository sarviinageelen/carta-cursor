import { eq } from "drizzle-orm";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { getDb, schema } from "@/server/db";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";
import { dec } from "@/domain/money";

export default async function ReservesPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const investments = getDb().select().from(schema.investments).where(eq(schema.investments.fundId, fundId)).all();
  const rows = investments.map((investment) => {
    const metrics = investmentMetrics(investment.id, today(), true);
    const incremental = dec(metrics.unrealized).plus(dec(metrics.realized)).minus(dec(metrics.invested));
    const nextReserve = "2000000";
    const incrementalMoic = dec(metrics.invested).gt(0)
      ? incremental.div(dec(nextReserve) || dec(1))
      : null;
    return {
      name: investment.name,
      invested: metrics.invested,
      plannedReserve: nextReserve,
      incrementalReturn: incremental.toFixed(),
      rank: incrementalMoic ? incrementalMoic.toFixed(2) : "n/a",
    };
  });
  rows.sort((a, b) => Number(b.rank) - Number(a.rank));
  return (
    <div className="space-y-4">
      <PageHeader title="Follow-on reserve analysis" description="Ranks expected return on incremental follow-on capital, not historical total MOIC relabeled as optimal." />
      <Callout title="Methodology">
        Prototype profile: (current residual + realized − invested) / planned next reserve check. Inspectable, not a proprietary optimizer.
      </Callout>
      <Panel>
        <DataTable
          columns={["Company", "Invested", "Planned next reserve", "Incremental value vs cost", "Rank metric"]}
          rows={rows.map((row) => [row.name, <Money key={row.name} value={row.invested} />, <Money key={`${row.name}-p`} value={row.plannedReserve} />, <Money key={`${row.name}-i`} value={row.incrementalReturn} />, row.rank])}
        />
      </Panel>
    </div>
  );
}
