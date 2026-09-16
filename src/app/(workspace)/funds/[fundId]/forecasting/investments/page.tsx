import Link from "next/link";
import { eq } from "drizzle-orm";
import { createInvestmentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money, multiple } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { investmentMetrics } from "@/server/services/investments";
import { today } from "@/server/clock";

export default async function InvestmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ fundId: string }>;
  searchParams: Promise<{ asOf?: string; q?: string }>;
}) {
  const { fundId } = await params;
  const sp = await searchParams;
  const asOf = sp.asOf || today();
  const historical = Boolean(sp.asOf && sp.asOf < today());
  const investments = getDb().select().from(schema.investments).where(eq(schema.investments.fundId, fundId)).all();
  const companies = getDb().select().from(schema.companies).all();
  const filtered = investments.filter((row) => !sp.q || row.name.toLowerCase().includes(sp.q.toLowerCase()));
  return (
    <div>
      <PageHeader
        title="Investments"
        description="Actual portfolio records. Planned is a forecasting status, not a Deal CRM stage."
      />
      {historical ? (
        <Callout tone="warning" title="Time Machine active">
          Metrics recalculated as of {asOf}. Stored history is not rewritten.{" "}
          <Link className="text-accent" href="?">
            Reset to today
          </Link>
        </Callout>
      ) : (
        <form className="mb-3 flex gap-2 text-[13px]">
          <Label>Time Machine month</Label>
          <Input type="date" name="asOf" defaultValue={asOf} />
          <Button variant="secondary" formAction="">
            Recalculate historically
          </Button>
        </form>
      )}
      <Panel className="mb-4">
        <DataTable
          columns={["Investment", "Status", "Invested", "Unrealized", "Realized", "MOIC"]}
          rows={filtered.map((investment) => {
            const metrics = investmentMetrics(investment.id, asOf, false);
            return [
              <Link key={investment.id} className="text-accent" href={`/funds/${fundId}/forecasting/investments/${investment.id}`}>
                {investment.name}
              </Link>,
              <Badge key={`${investment.id}-s`}>{investment.status}</Badge>,
              <Money key={`${investment.id}-i`} value={metrics.invested} />,
              <Money key={`${investment.id}-u`} value={metrics.unrealized} />,
              <Money key={`${investment.id}-r`} value={metrics.realized} />,
              metrics.moic?.status === "ok" ? multiple(metrics.moic.value) : "n/a",
            ];
          })}
        />
      </Panel>
      <Panel className="p-4">
        <h2 className="mb-2 text-[15px] font-semibold">Add investment</h2>
        <form action={createInvestmentAction} className="grid max-w-lg gap-2">
          <input type="hidden" name="fundId" value={fundId} />
          <Label>Name</Label>
          <Input name="name" required />
          <Label>Company</Label>
          <Select name="companyId">
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
          <Label>First investment date</Label>
          <Input type="date" name="date" required />
          <Label>Amount</Label>
          <Input name="amount" defaultValue="2000000" />
          <Label>Ownership</Label>
          <Input name="ownership" defaultValue="0.10" />
          <Label>Projected exit date</Label>
          <Input type="date" name="exitDate" defaultValue="2030-01-01" />
          <Label>Projected exit proceeds</Label>
          <Input name="exitAmount" defaultValue="8000000" />
          <Button type="submit">Create</Button>
        </form>
      </Panel>
    </div>
  );
}
