import { eq } from "drizzle-orm";
import { submitKpiAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";

export default async function SubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const request =
    getDb().select().from(schema.kpiRequests).where(eq(schema.kpiRequests.token, token)).get() ??
    getDb().select().from(schema.collectionRequests).where(eq(schema.collectionRequests.token, token)).get();
  if (!request) {
    return <Callout tone="warning" title="Link invalid">Token not found or revoked.</Callout>;
  }
  const defs = getDb().select().from(schema.kpiDefinitions).all().filter((row) => "companyId" in request && row.companyId === (request as { companyId: string }).companyId);
  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-lg">
        <PageHeader title="Scoped submission" description="Submitters do not receive the company's private history. This is not a full firm login." />
        <Panel className="p-4">
          {defs.map((def) => (
            <form key={def.id} action={submitKpiAction} className="mb-3 grid gap-2">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="definitionId" value={def.id} />
              <Label>{def.name}</Label>
              <Input name="proposedValue" required />
              <Button type="submit">Submit {def.name}</Button>
            </form>
          ))}
        </Panel>
      </div>
    </div>
  );
}
