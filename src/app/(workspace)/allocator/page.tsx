import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Money, multiple } from "@/components/money";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { performanceMultiples } from "@/domain/metrics";
import { dec } from "@/domain/money";

export default async function AllocatorPage() {
  const holdings = getDb().select().from(schema.allocatorHoldings).all();
  const paidIn = holdings.reduce((acc, row) => acc.plus(dec(row.paidIn)), dec(0));
  const dist = holdings.reduce((acc, row) => acc.plus(dec(row.distributions)), dec(0));
  const residual = holdings.reduce((acc, row) => acc.plus(dec(row.residual)), dec(0));
  const multiples = performanceMultiples({
    paidIn: paidIn.toFixed(),
    distributions: dist.toFixed(),
    residualValue: residual.toFixed(),
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Allocator analytics" description="Synthetic cross-manager holdings. Separate from GP LP CRM and the LP Portal." />
      <Callout title="Aggregation">TVPI uses aggregate amounts on a matched basis, not an average of vehicle ratios.</Callout>
      <Panel className="flex flex-wrap">
        <Metric label="Paid-in" value={<Money value={paidIn.toFixed()} />} />
        <Metric label="DPI" value={multiples.status === "ok" ? multiple(multiples.value.dpi) : "n/a"} />
        <Metric label="TVPI" value={multiples.status === "ok" ? multiple(multiples.value.tvpi) : "n/a"} />
      </Panel>
      <Panel>
        <DataTable
          columns={["Manager", "Vehicle", "Paid-in", "Distributions", "Residual"]}
          rows={holdings.map((row) => [row.managerName, row.vehicleName, <Money key={row.id} value={row.paidIn} />, <Money key={`${row.id}-d`} value={row.distributions} />, <Money key={`${row.id}-r`} value={row.residual} />])}
        />
      </Panel>
    </div>
  );
}
