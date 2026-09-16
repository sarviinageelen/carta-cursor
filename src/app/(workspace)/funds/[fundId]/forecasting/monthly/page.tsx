import { saveMonthlyOverride } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { monthlyModel, projectedDealCount } from "@/server/services/forecast";
import { today } from "@/server/clock";

export default async function MonthlyPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const asOf = today();
  const rows = monthlyModel(fundId, "current", asOf);
  const deals = projectedDealCount(fundId);
  return (
    <div className="space-y-4">
      <PageHeader title="Monthly cash-flow model" description="Actual overrides change reporting. They do not replan projected investment counts." />
      <Callout title="Deal count invariant">Construction projected deal count remains {deals ?? "n/a"} after expense overrides.</Callout>
      <Panel>
        <DataTable
          columns={["Month", "Kind", "Initial", "Expenses", "Override"]}
          rows={rows.slice(0, 24).map((row) => [
            row.month,
            <Badge key={row.month}>{row.kind}</Badge>,
            <Money key={`${row.month}-i`} value={row.initial} />,
            <Money key={`${row.month}-e`} value={row.expenses} />,
            row.kind === "actual" ? (
              <form key={`${row.month}-f`} action={saveMonthlyOverride} className="flex gap-1">
                <input type="hidden" name="fundId" value={fundId} />
                <input type="hidden" name="month" value={row.month} />
                <Input name="amount" defaultValue={row.expenses} className="h-7 w-24" />
                <Button variant="secondary">Save</Button>
              </form>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
    </div>
  );
}
