import Link from "next/link";
import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel } from "@/components/ui/panel";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";
import { Money } from "@/components/money";

export default async function PortfolioPage() {
  const companies = getDb().select().from(schema.companies).all();
  const investments = getDb().select().from(schema.investments).all();
  return (
    <div>
      <PageHeader title="Portfolio" description="Cross-fund company context. Shared companies appear once with multiple investment IDs." />
      <Panel>
        <DataTable
          columns={["Company", "Investments", "Cost (all funds)"]}
          rows={companies.map((company) => {
            const owned = investments.filter((row) => row.companyId === company.id);
            const cost = owned.reduce((acc, row) => acc + Number(investmentMetrics(row.id, today(), false).invested), 0);
            return [
              <Link key={company.id} className="text-accent" href={`/crm/companies/${company.id}`}>
                {company.name}
              </Link>,
              owned.map((row) => row.fundId).join(", ") || "—",
              <Money key={`${company.id}-c`} value={String(cost)} />,
            ];
          })}
        />
      </Panel>
    </div>
  );
}
