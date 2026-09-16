import { PageHeader, Panel } from "@/components/ui/panel";
import { DataTable } from "@/components/data-table";
import { getDb, schema } from "@/server/db";

export default async function ForecastDocumentsPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const docs = getDb().select().from(schema.documents).all().filter((row) => row.relatedId === fundId || row.category === "deal");
  return (
    <div>
      <PageHeader title="Document Center" description="Forecasting documents linked to investments or the fund. Not the full audit/tax repository." />
      <Panel>
        <DataTable columns={["Name", "Category", "Related"]} rows={docs.map((row) => [row.name, row.category, row.relatedId ?? "—"])} />
      </Panel>
    </div>
  );
}
