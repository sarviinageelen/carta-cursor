import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { today } from "@/server/clock";

function vestedFraction(start: string, months: number, cliff: number, asOf: string) {
  const startDate = Date.parse(`${start}T00:00:00Z`);
  const asOfDate = Date.parse(`${asOf}T00:00:00Z`);
  const elapsed = Math.floor((asOfDate - startDate) / (365.25 / 12 * 86400000));
  if (elapsed < cliff) return 0;
  return Math.min(1, elapsed / months);
}

export default async function CarryPage() {
  const units = getDb().select().from(schema.gpCarryUnits).all();
  const asOf = today();
  return (
    <div className="space-y-4">
      <PageHeader title="GP carry & vesting" description="Accrued carry is not cash received. GP commitment return is separate from carry." />
      <Callout title="As of">{asOf}</Callout>
      <Panel>
        <DataTable
          columns={["Member", "Units", "Vested fraction", "Accrued vs paid"]}
          rows={units.map((row) => [
            row.memberName,
            row.units,
            vestedFraction(row.vestingStart, row.vestingMonths, row.cliffMonths, asOf).toFixed(2),
            "Accrued only — no bank cash",
          ])}
        />
      </Panel>
    </div>
  );
}
