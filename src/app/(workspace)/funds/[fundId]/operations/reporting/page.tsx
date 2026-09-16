import { eq } from "drizzle-orm";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { rejectCrossCurrencyTotal } from "@/domain/fx";

export default async function MultiFundPlaceholder({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const session = await getSession();
  const views = getDb().select().from(schema.multiFundViews).where(eq(schema.multiFundViews.firmId, session?.firmId ?? "firm_northbridge")).all();
  const check = rejectCrossCurrencyTotal(["USD", "USD"]);
  return (
    <div>
      <PageHeader title="Grouped views" description="Analytical grouping only — no ownership cash flows are created." />
      <Panel>
        <DataTable
          columns={["View", "Funds", "Currency"]}
          rows={views.map((row) => [row.name, row.fundIdsJson, row.currency])}
        />
      </Panel>
      <p className="mt-2 text-[12px] text-muted">
        Context fund {fundId}. Same-currency check: {check.status}. A fund-of-funds investment is created from Investments → portfolio fund, not from this view.
      </p>
    </div>
  );
}
