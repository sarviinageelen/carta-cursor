import { postValuationAction, saveValuationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { accountNet } from "@/server/services/accounting";
import { today } from "@/server/clock";

export default async function ValuationsPage() {
  const valuations = getDb().select().from(schema.valuations).all();
  const navBefore = accountNet("fund_nb_ii", "1400", today());
  return (
    <div className="space-y-4">
      <PageHeader title="Valuation workbench" description="Draft edits do not change booked NAV. Posting is explicit, idempotent, and writes a journal." />
      <Callout title="Booked Fund II investments FV">{navBefore} — draft rows below do not affect this until posted.</Callout>
      <Panel>
        <DataTable
          columns={["Company", "As of", "Status", "Equity", "Fund NAV impact", "Post"]}
          rows={valuations.map((row) => [
            row.companyId,
            row.asOfDate,
            <Badge key={row.id} tone={row.status === "posted" ? "success" : "warning"}>
              {row.status}
            </Badge>,
            <Money key={`${row.id}-e`} value={row.equityValue} />,
            <Money key={`${row.id}-n`} value={row.fundNavImpact} />,
            row.status === "draft" ? (
              <form key={`${row.id}-f`} action={postValuationAction}>
                <input type="hidden" name="valuationId" value={row.id} />
                <Button>Post</Button>
              </form>
            ) : (
              row.postedJournalId
            ),
          ])}
        />
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-2 font-medium">New draft (post-money / comps / DCF mix)</h2>
        <form action={saveValuationAction} className="grid max-w-xl gap-2">
          <Label>Company ID</Label>
          <Input name="companyId" defaultValue="co_nimbus" />
          <Label>Fund ID</Label>
          <Input name="fundId" defaultValue="fund_nb_ii" />
          <Label>As of</Label>
          <Input type="date" name="asOfDate" defaultValue={today()} />
          <input
            type="hidden"
            name="methodsJson"
            value={JSON.stringify([
              { method: "post_money", weight: "0.6", postMoney: "40000000" },
              { method: "public_comps", weight: "0.4", metric: "8000000", comps: [{ name: "Peer", multiple: "6", weight: "1" }], netDebt: "0" },
            ])}
          />
          <Button type="submit">Save draft</Button>
        </form>
        <p className="mt-2 text-[12px] text-muted">OPM/backsolve is unsupported and will be disclosed rather than silently substituted.</p>
      </Panel>
    </div>
  );
}
