import { eq } from "drizzle-orm";
import { confirmBankAction, payDistributionAction, requestDistributionAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function DistributionsPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const dists = getDb().select().from(schema.distributions).where(eq(schema.distributions.fundId, fundId)).all();
  const payments = getDb().select().from(schema.distributionPayments).all();
  const investors = getDb().select().from(schema.investors).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Distributions" description="Modeled waterfall proceeds are not payments. Bank outcomes are simulated and labeled." />
      <Callout title="Simulation">Payment references are local SIM- IDs. No bank transfer is initiated.</Callout>
      {dists.map((dist) => (
        <Panel key={dist.id}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <div>
              {dist.memo} · <Money value={dist.amount} />
            </div>
            <Badge tone={dist.status.includes("blocked") ? "danger" : "neutral"}>{dist.status}</Badge>
          </div>
          <DataTable
            columns={["Investor", "Amount", "Bank", "Status", "Simulated ref"]}
            rows={payments
              .filter((row) => row.distributionId === dist.id)
              .map((row) => [
                investors.find((item) => item.id === row.investorId)?.name ?? row.investorId,
                <Money key={row.id} value={row.amount} exact />,
                row.bankConfirmed ? "confirmed" : "missing",
                row.status,
                row.simulatedPaymentRef ?? "—",
              ])}
          />
          <div className="flex gap-2 p-3">
            <form action={payDistributionAction}>
              <input type="hidden" name="distributionId" value={dist.id} />
              <Button type="submit">Simulate approval / pay</Button>
            </form>
            {payments.some((row) => row.distributionId === dist.id && !row.bankConfirmed) ? (
              <form action={confirmBankAction} className="flex gap-2">
                <input type="hidden" name="distributionId" value={dist.id} />
                <SelectInvestor payments={payments.filter((row) => row.distributionId === dist.id && !row.bankConfirmed)} />
                <Button variant="secondary">Confirm bank details and retry</Button>
              </form>
            ) : null}
          </div>
        </Panel>
      ))}
      <Panel className="p-4">
        <form action={requestDistributionAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Amount</Label>
          <Input name="amount" defaultValue="500000" />
          <Label>Memo</Label>
          <Input name="memo" defaultValue="New distribution request" />
          <Button type="submit">Request distribution</Button>
        </form>
      </Panel>
    </div>
  );
}

function SelectInvestor({ payments }: { payments: Array<{ investorId: string }> }) {
  return (
    <select name="investorId" className="h-8 rounded-[6px] border border-line px-2 text-[13px]">
      {payments.map((row) => (
        <option key={row.investorId} value={row.investorId}>
          {row.investorId}
        </option>
      ))}
    </select>
  );
}
