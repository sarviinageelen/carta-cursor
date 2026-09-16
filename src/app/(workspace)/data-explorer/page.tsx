import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDemoClock } from "@/server/clock";

const DATASETS = ["capital_activities", "investments", "journal_entries", "commitments"] as const;
const AGGS = ["count", "sum_amount"] as const;

export default async function DataExplorerPage() {
  const queries = getDb().select().from(schema.savedQueries).all();
  const clock = getDemoClock();
  const snapshot = getDb().select().from(schema.demoSettings).all()[0];
  const activities = getDb().select().from(schema.capitalActivities).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Data explorer" description="Allowlisted datasets only. Warehouse snapshot freshness is disclosed and is not live accounting." />
      <Callout title="Warehouse snapshot">
        last_refreshed_at {snapshot?.warehouseRefreshedAt} · demo clock {clock}. These figures are not instant transactional state.
      </Callout>
      <Panel className="p-4 text-[13px]">
        <div className="mb-2 font-medium">Allowlist</div>
        <p>Datasets: {DATASETS.join(", ")}. Aggregates: {AGGS.join(", ")}.</p>
        <DataTable
          columns={["Saved query", "Dataset", "Aggregate"]}
          rows={queries.map((row) => [row.name, row.dataset, row.aggregate])}
        />
        <div className="mt-3">Live transactional capital activity count: {activities.length} (not the warehouse snapshot).</div>
      </Panel>
    </div>
  );
}
