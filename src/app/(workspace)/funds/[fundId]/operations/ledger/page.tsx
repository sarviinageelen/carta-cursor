import { eq } from "drizzle-orm";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { balancesAsOf } from "@/server/services/accounting";
import { today } from "@/server/clock";

export default async function LedgerPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const asOf = today();
  const balances = balancesAsOf(fundId, asOf);
  const entries = getDb().select().from(schema.journalEntries).where(eq(schema.journalEntries.entityId, fundId)).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Ledger" description="Posted journals only. Future-effective entries exist but are excluded from as-of balances." />
      <Callout title="As of">{asOf}</Callout>
      <Panel>
        <DataTable
          columns={["Account", "Name", "Debit", "Credit", "Net"]}
          rows={balances.map((row) => [row.accountCode, row.accountName, <Money key={`${row.accountCode}-d`} value={row.debit} exact />, <Money key={`${row.accountCode}-c`} value={row.credit} exact />, <Money key={`${row.accountCode}-n`} value={row.net} exact />])}
        />
      </Panel>
      <Panel>
        <DataTable
          columns={["Date", "Effective", "Memo", "Source", "Status"]}
          rows={entries.map((row) => [row.date, row.effectiveDate, row.memo, `${row.sourceType}:${row.sourceId}`, row.status])}
        />
      </Panel>
    </div>
  );
}
