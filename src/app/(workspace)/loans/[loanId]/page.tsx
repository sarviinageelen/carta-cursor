import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { Callout, Metric, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { accrueFixedInterest } from "@/domain/loan";
import { today } from "@/server/clock";

export default async function LoanDetailPage({ params }: { params: Promise<{ loanId: string }> }) {
  const { loanId } = await params;
  const loan = getDb().select().from(schema.loans).where(eq(schema.loans.id, loanId)).get();
  if (!loan) notFound();
  const events = getDb().select().from(schema.loanEvents).where(eq(schema.loanEvents.loanId, loanId)).all();
  const interest = accrueFixedInterest({
    principal: loan.outstanding,
    annualRate: loan.annualRate,
    startDate: loan.startDate,
    endDate: today(),
    dayCount: "ACT/365F",
    pik: loan.pik,
  });
  return (
    <div className="space-y-4">
      <PageHeader title={loan.name} description={`${loan.borrower} · ${loan.dayCount}`} />
      <Panel className="flex flex-wrap">
        <Metric label="Principal" value={<Money value={loan.principal} />} />
        <Metric label="Outstanding" value={<Money value={loan.outstanding} />} />
        <Metric label="Accrued interest" value={interest.status === "ok" ? <Money value={interest.value} /> : interest.message} />
      </Panel>
      {loan.pik ? <Callout tone="warning" title="Unsupported">PIK is not calculated in loan_fixed_act365f_v1.</Callout> : null}
      <Panel>
        <DataTable columns={["Date", "Kind", "Amount", "Note"]} rows={events.map((row) => [row.date, row.kind, <Money key={row.id} value={row.amount} />, row.note])} />
      </Panel>
    </div>
  );
}
