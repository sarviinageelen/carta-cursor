import Link from "next/link";
import { createDealAction, updateDealStageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { Money } from "@/components/money";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function DealsPage() {
  const deals = getDb().select().from(schema.deals).all();
  const companies = getDb().select().from(schema.companies).all();
  return (
    <div className="space-y-4">
      <PageHeader title="Deal CRM" description="Spreadsheet-style pipeline. There is no automatic conversion from a deal to a booked investment." />
      <Panel>
        <DataTable
          columns={["Deal", "Company", "Stage", "Amount", "Source", "Move"]}
          rows={deals.map((deal) => [
            <Link key={deal.id} className="text-accent" href={`/crm/companies/${deal.companyId}`}>
              {deal.name}
            </Link>,
            companies.find((row) => row.id === deal.companyId)?.name ?? deal.companyId,
            deal.stage,
            <Money key={`${deal.id}-a`} value={deal.amount} />,
            deal.source,
            <form key={`${deal.id}-f`} action={updateDealStageAction} className="flex gap-1">
              <input type="hidden" name="dealId" value={deal.id} />
              <Select name="stage" defaultValue={deal.stage} className="h-7 w-28">
                {["watch", "intro", "diligence", "ic", "won", "passed"].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </Select>
              <Button variant="secondary">Save</Button>
            </form>,
          ])}
        />
      </Panel>
      <Panel className="p-4">
        <form action={createDealAction} className="grid max-w-lg gap-2">
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
          <Label>Amount</Label>
          <Input name="amount" defaultValue="2500000" />
          <Button type="submit">Create deal</Button>
        </form>
      </Panel>
      <Callout title="Email ingestion">A fixture-parsed intro exists on Wren Security. This is not a live inbox.</Callout>
    </div>
  );
}
