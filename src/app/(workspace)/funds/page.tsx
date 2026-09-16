import Link from "next/link";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { constructionForecastForFund, currentForecastForFund } from "@/server/services/forecast";
import { today } from "@/server/clock";

export default async function FundsPage() {
  const funds = getDb()
    .select()
    .from(schema.legalEntities)
    .where(eq(schema.legalEntities.firmId, "firm_northbridge"))
    .all()
    .filter((row) => row.kind === "fund" || row.kind === "spv");
  const asOf = today();
  const rows = funds.map((fund) => {
    const construction = constructionForecastForFund(fund.id);
    const current = currentForecastForFund(fund.id, asOf);
    return [
      <Link key={fund.id} className="text-accent" href={`/funds/${fund.id}`}>
        {fund.name}
      </Link>,
      <Badge key={`${fund.id}-k`}>{fund.kind}</Badge>,
      fund.currency,
      <Money key={`${fund.id}-c`} value={fund.commitments} />,
      construction?.status === "ok" ? Number(construction.value.projectedDealCount).toFixed(1) : "—",
      current?.status === "ok" ? <Money key={`${fund.id}-r`} value={current.value.actualInvested} /> : "—",
    ];
  });
  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Funds and SPVs. Construction templates initialize editable assumptions; they are not Carta defaults."
        actions={
          <Button asChild>
            <Link href="/funds/new">New fund</Link>
          </Button>
        }
      />
      <Panel>
        <DataTable columns={["Vehicle", "Kind", "CCY", "Commitments", "Construction deals", "Actual invested"]} rows={rows} />
      </Panel>
    </div>
  );
}
