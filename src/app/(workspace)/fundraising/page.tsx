import { advanceClosingAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

const NEXT: Record<string, string> = {
  invited: "in_progress",
  in_progress: "signed",
  signed: "countersigned",
};

export default async function FundraisingPage() {
  const closings = getDb().select().from(schema.closings).all();
  const investors = getDb().select().from(schema.investors).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Fundraising & closings" description="Invited → In progress → Signed → Countersigned. Signatures are simulated. Target, soft, and legal commitments stay distinct." />
      <Callout title="Simulation">Countersignature is a local status change. No document is legally executed.</Callout>
      <Panel>
        <DataTable
          columns={["Investor", "Status", "Target", "Legal", "Advance"]}
          rows={closings.map((row) => [
            investors.find((item) => item.id === row.investorId)?.name ?? row.investorId,
            <Badge key={row.id}>{row.status}</Badge>,
            <Money key={`${row.id}-t`} value={row.targetAmount} />,
            row.legalCommitment ? <Money key={`${row.id}-l`} value={row.legalCommitment} /> : "—",
            NEXT[row.status] ? (
              <form key={`${row.id}-f`} action={advanceClosingAction}>
                <input type="hidden" name="closingId" value={row.id} />
                <input type="hidden" name="nextStatus" value={NEXT[row.status]} />
                <Button variant="secondary">Mark {NEXT[row.status].replace("_", " ")}</Button>
              </form>
            ) : (
              "complete"
            ),
          ])}
        />
      </Panel>
    </div>
  );
}
