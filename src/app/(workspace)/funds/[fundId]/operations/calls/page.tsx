import { eq } from "drizzle-orm";
import { issueCallAction, recordReceiptAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { callOutstanding } from "@/server/services/capital";
import { PROTOTYPE_ACCOUNTING_POLICY } from "@/domain/profiles";

export default async function CallsPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const activities = getDb()
    .select()
    .from(schema.capitalActivities)
    .where(eq(schema.capitalActivities.fundId, fundId))
    .all()
    .filter((row) => row.kind === "capital_call");
  const investors = getDb().select().from(schema.investors).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Capital calls" description="Notice, effective-date recognition, and cash receipt are distinct. Called capital is not automatically paid-in." />
      <Callout title="Prototype accounting policy (not Carta's verified policy)">
        {PROTOTYPE_ACCOUNTING_POLICY.rules.join(" ")}
      </Callout>
      {activities.map((activity) => (
        <Panel key={activity.id} className="mb-3">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <div>
              {activity.memo} · notice {activity.noticeDate} · effective {activity.effectiveDate}
            </div>
            <Badge>{activity.status}</Badge>
          </div>
          <DataTable
            columns={["Investor", "Called", "Received", "Outstanding", "Record receipt"]}
            rows={callOutstanding(activity.id).map((row) => [
              investors.find((item) => item.id === row.investorId)?.name ?? row.investorId,
              <Money key={`${row.id}-c`} value={row.amount} exact />,
              <Money key={`${row.id}-r`} value={row.receivedAmount} exact />,
              <Money key={`${row.id}-o`} value={row.outstanding} exact />,
              <form key={`${row.id}-f`} action={recordReceiptAction} className="flex gap-1">
                <input type="hidden" name="activityId" value={activity.id} />
                <input type="hidden" name="investorId" value={row.investorId} />
                <Input name="amount" className="h-7 w-28" defaultValue={row.outstanding} />
                <Button variant="secondary">Receive</Button>
              </form>,
            ])}
          />
        </Panel>
      ))}
      <Panel className="p-4">
        <h2 className="mb-2 font-medium">Issue call</h2>
        <form action={issueCallAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Amount</Label>
          <Input name="amount" defaultValue="1000000" />
          <Label>Effective date</Label>
          <Input type="date" name="effectiveDate" />
          <Label>Due date</Label>
          <Input type="date" name="dueDate" />
          <Label>Memo</Label>
          <Input name="memo" defaultValue="Follow-on call" />
          <Button type="submit">Issue (fund ops persona)</Button>
        </form>
      </Panel>
    </div>
  );
}
