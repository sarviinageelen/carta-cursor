import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { lpMaySeeDate } from "@/server/auth/session";
import { today } from "@/server/clock";

export default async function LpPortalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.persona !== "lp" && session.persona !== "investor_relations" && session.persona !== "fund_ops" && session.persona !== "investment_editor") {
    return <Callout tone="warning" title="Permission">This portal is scoped to LP identities.</Callout>;
  }
  const investorId = session.investorId ?? "lp_atlantic";
  const investor = getDb().select().from(schema.investors).where(eq(schema.investors.id, investorId)).get();
  const policy = investor?.disclosurePolicyId
    ? getDb().select().from(schema.disclosurePolicies).where(eq(schema.disclosurePolicies.id, investor.disclosurePolicyId)).get()
    : null;
  const cutoff = policy?.cutoffDate ?? null;
  const commitments = getDb().select().from(schema.commitments).where(eq(schema.commitments.investorId, investorId)).all();
  const funds = getDb().select().from(schema.legalEntities).all();
  const allocations = getDb()
    .select()
    .from(schema.capitalAllocations)
    .all()
    .filter((row) => row.investorId === investorId);
  const notices = getDb()
    .select()
    .from(schema.capitalActivities)
    .all()
    .filter((row) => allocations.some((alloc) => alloc.activityId === row.id) && lpMaySeeDate(session, row.noticeDate, cutoff));
  const otherLp = getDb().select().from(schema.investors).all().filter((row) => row.id !== investorId);
  return (
    <div className="space-y-4">
      <PageHeader
        title="LP Portal"
        description={`${investor?.name ?? "LP"} · policy ${policy?.name ?? "default"} · cutoff ${cutoff ?? "none"}`}
      />
      <Callout title="Disclosure is enforced in data access">
        Other LP names and returns are not serialized here ({otherLp.length} other investors exist in the firm database). Activities after the cutoff are omitted.
      </Callout>
      <Panel>
        <DataTable
          columns={["Fund", "Commitment", "Status"]}
          rows={commitments.map((row) => [
            <Link key={row.id} className="text-accent" href={`/lp/funds/${row.fundId}`}>
              {funds.find((fund) => fund.id === row.fundId)?.name ?? row.fundId}
            </Link>,
            <Money key={`${row.id}-a`} value={row.amount} />,
            row.status,
          ])}
        />
      </Panel>
      <Panel>
        <DataTable
          columns={["Notice", "Amount", "Date"]}
          rows={notices.map((row) => {
            const alloc = allocations.find((item) => item.activityId === row.id);
            return [row.memo, <Money key={row.id} value={alloc?.amount ?? row.amount} />, row.noticeDate];
          })}
        />
      </Panel>
      <p className="text-[12px] text-muted">As-of {today()}.</p>
    </div>
  );
}
