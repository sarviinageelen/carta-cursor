import { evaluateFormula } from "@/domain/formula";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export default async function FormulasPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const formulas = getDb().select().from(schema.formulas).where(eq(schema.formulas.fundId, fundId)).all();
  const sample = evaluateFormula("(arr - arr_prior) / arr_prior", [
    { name: "arr", value: "21000000" },
    { name: "arr_prior", value: "18000000" },
  ]);
  return (
    <div className="space-y-4">
      <PageHeader title="Formulas" description="Restricted arithmetic grammar. Relative periods shift with the selected reporting period. No eval." />
      <Panel className="p-4 text-[13px]">
        {formulas.map((formula) => (
          <div key={formula.id} className="mb-2">
            <div className="font-medium">{formula.name}</div>
            <code>{formula.expression}</code>
          </div>
        ))}
        <Callout title="Sample recalculation against current period">
          {sample.status === "ok" ? `ARR growth = ${sample.value}` : sample.message}
        </Callout>
      </Panel>
    </div>
  );
}
