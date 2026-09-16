import Link from "next/link";
import { getDb, schema } from "@/server/db";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/ui/panel";

export default async function LoansPage() {
  const loans = getDb().select().from(schema.loans).all();
  return (
    <div>
      <PageHeader title="Loan operations" description="Fixed-rate ACT/365F profile. PIK and other day-count conventions are rejected." />
      <Panel>
        <DataTable
          columns={["Loan", "Borrower", "Outstanding", "Rate", "Status"]}
          rows={loans.map((row) => [
            <Link key={row.id} className="text-accent" href={`/loans/${row.id}`}>
              {row.name}
            </Link>,
            row.borrower,
            <Money key={`${row.id}-o`} value={row.outstanding} />,
            row.annualRate,
            <Badge key={`${row.id}-s`}>{row.status}</Badge>,
          ])}
        />
      </Panel>
    </div>
  );
}
