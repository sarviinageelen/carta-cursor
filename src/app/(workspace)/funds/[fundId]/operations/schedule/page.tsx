import { eq } from "drizzle-orm";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";

export default async function SchedulePage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const investments = getDb().select().from(schema.investments).where(eq(schema.investments.fundId, fundId)).all();
  return (
    <div>
      <PageHeader title="Schedule of investments" description="Booked values. Draft valuations are excluded until posted." />
      <Panel>
        <DataTable
          columns={["Investment", "Cost", "FV / residual", "Realized"]}
          rows={investments.map((row) => {
            const metrics = investmentMetrics(row.id, today(), false);
            return [row.name, <Money key={`${row.id}-c`} value={metrics.invested} />, <Money key={`${row.id}-u`} value={metrics.unrealized} />, <Money key={`${row.id}-r`} value={metrics.realized} />];
          })}
        />
      </Panel>
    </div>
  );
}
