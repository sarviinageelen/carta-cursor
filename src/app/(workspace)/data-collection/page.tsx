import { createKpiRequestAction, reviewKpiAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { getSession } from "@/server/auth/session";
import Link from "next/link";

export default async function DataCollectionPage() {
  const session = await getSession();
  const requests = getDb().select().from(schema.collectionRequests).all();
  const answers = getDb().select().from(schema.collectionAnswers).all();
  const submissions = getDb().select().from(schema.kpiSubmissions).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Data collection" description="Company/period requests, scoped submission, review, and source-line traceability for structured fixtures." />
      <Callout title="Extraction boundary">Arbitrary PDFs are not auto-extracted. Sample mapping is labeled as a fixture.</Callout>
      <Panel>
        <DataTable
          columns={["Company", "Period", "Status", "Submit"]}
          rows={requests.map((row) => [
            row.companyId,
            row.period,
            row.status,
            <Link key={row.id} className="text-accent" href={`/submit/${row.token}`}>
              Open scoped link
            </Link>,
          ])}
        />
      </Panel>
      <Panel>
        <DataTable columns={["Question", "Value", "Source line", "Status"]} rows={answers.map((row) => [row.question, row.value, row.sourceLine, row.status])} />
      </Panel>
      <Panel>
        <div className="border-b border-line px-4 py-2 text-[12px] font-medium uppercase text-muted">KPI submissions</div>
        <DataTable
          columns={["Proposed", "Prior accepted", "Status", "Review"]}
          rows={submissions.map((row) => [
            row.proposedValue,
            row.priorValue ?? "—",
            <Badge key={row.id}>{row.status}</Badge>,
            session?.persona === "company_submitter" ? (
              "—"
            ) : (
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
            ),
          ])}
        />
      </Panel>
      <Panel className="p-4">
        <form action={createKpiRequestAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="companyId" value={session?.companyId ?? "co_lumenforge"} />
          <Label>Period</Label>
          <Input name="period" defaultValue="2026-09" />
          <label className="text-[13px]">
            <input type="checkbox" name="autoApprove" /> Auto-approve
          </label>
          <Button type="submit">New KPI request</Button>
        </form>
      </Panel>
    </div>
  );
}
