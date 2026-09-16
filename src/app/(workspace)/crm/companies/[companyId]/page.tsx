import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { PageHeader, Panel, Callout } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = getDb().select().from(schema.companies).where(eq(schema.companies.id, companyId)).get();
  if (!company) notFound();
  const interactions = getDb().select().from(schema.interactions).all().filter((row) => row.companyId === companyId);
  const investments = getDb().select().from(schema.investments).all().filter((row) => row.companyId === companyId);
  return (
    <div className="space-y-4">
      <PageHeader title={company.name} description={`${company.legalName} · ${company.sector} · ${company.stage}`} />
      <Callout title="Company brief (fixture)">
        Brief generated from local records/documents for {company.name}. Cited: interactions ({interactions.length}), investments ({investments.map((row) => row.id).join(", ") || "none"}). No live LLM call was made.
      </Callout>
      <Panel>
        <DataTable columns={["When", "Kind", "Subject", "Provenance"]} rows={interactions.map((row) => [row.occurredAt, row.kind, row.subject, row.sourceProvenance])} />
      </Panel>
    </div>
  );
}
