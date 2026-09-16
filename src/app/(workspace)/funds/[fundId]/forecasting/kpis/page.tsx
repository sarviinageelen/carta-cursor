import Link from "next/link";
import { createKpiRequestAction, reviewKpiAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function ForecastKpisPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const defs = getDb().select().from(schema.kpiDefinitions).all();
  const values = getDb().select().from(schema.kpiValues).all();
  const submissions = getDb().select().from(schema.kpiSubmissions).all();
  return (
    <div className="space-y-4">
      <PageHeader title="KPI Manager" description="Accepted values and pending submissions are separate. Rejection leaves the prior accepted value intact." />
      <Panel>
        <DataTable
          columns={["KPI", "Period", "Value", "Status", "Provenance"]}
          rows={values.map((row) => {
            const def = defs.find((item) => item.id === row.definitionId);
            return [def?.name ?? row.definitionId, row.period, row.value, <Badge key={row.id}>{row.status}</Badge>, row.provenance];
          })}
        />
      </Panel>
      <Panel>
        <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase text-muted">Pending review</div>
        <DataTable
          columns={["Proposed", "Prior", "Status", "Action"]}
          rows={submissions.map((row) => [
            row.proposedValue,
            row.priorValue ?? "—",
            <Badge key={row.id} tone={row.status === "pending_review" ? "warning" : "neutral"}>
              {row.status}
            </Badge>,
            row.status === "pending_review" ? (
              <div key={`${row.id}-a`} className="flex gap-1">
                <form action={reviewKpiAction}>
                  <input type="hidden" name="submissionId" value={row.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <Button>Accept</Button>
                </form>
                <form action={reviewKpiAction}>
                  <input type="hidden" name="submissionId" value={row.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button variant="secondary">Reject</Button>
                </form>
              </div>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
      <Panel className="p-4">
        <form action={createKpiRequestAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="companyId" value="co_lumenforge" />
          <Label>Period</Label>
          <Input name="period" defaultValue="2026-09" />
          <label className="text-[13px]">
            <input type="checkbox" name="autoApprove" /> Auto-approve
          </label>
          <Button type="submit">Create request</Button>
        </form>
        <p className="mt-2 text-[12px] text-muted">
          External submission: <Link className="text-accent" href="/submit/sub_lumenforge_q2_demo">/submit/sub_lumenforge_q2_demo</Link>
        </p>
        <p className="text-[12px] text-muted">Fund context {fundId} is used for navigation only; KPI values are company-scoped.</p>
      </Panel>
      <Callout title="Collection vs KPI approval">Confirmed Data Collection values can feed forecasting; they are not the same as a KPI request auto-approve setting.</Callout>
    </div>
  );
}
