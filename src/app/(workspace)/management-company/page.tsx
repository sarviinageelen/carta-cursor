import { allocateExpenseAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { balancesAsOf } from "@/server/services/accounting";
import { today } from "@/server/clock";

export default async function ManCoPage() {
  const expenses = getDb().select().from(schema.expenses).all();
  const balances = balancesAsOf("manco_nb", today());
  return (
    <div className="space-y-4">
      <PageHeader title="Management company" description="Expenses, intercompany allocations, and ledger drill-down. Ramp is a fixture-backed import, not a live connection." />
      <Callout title="Ramp">Seeded legal invoice is labeled ramp_fixture. Claude-for-Excel budgeting is not recreated as native Carta functionality.</Callout>
      <Panel>
        <DataTable
          columns={["Vendor", "Amount", "Category", "Source"]}
          rows={expenses.map((row) => [row.vendor, <Money key={row.id} value={row.amount} />, row.category, row.source])}
        />
      </Panel>
      <Panel>
        <DataTable
          columns={["Account", "Net"]}
          rows={balances.map((row) => [row.accountName, <Money key={row.accountCode} value={row.net} exact />])}
        />
      </Panel>
      <Panel className="p-4">
        <form action={allocateExpenseAction} className="grid max-w-lg gap-2">
          <Label>Fund</Label>
          <Input name="fundId" defaultValue="fund_nb_ii" />
          <Label>Amount</Label>
          <Input name="amount" defaultValue="5000.00" />
          <Button type="submit">Allocate and post intercompany pair</Button>
        </form>
      </Panel>
    </div>
  );
}
