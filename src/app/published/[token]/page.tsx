import { eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { Callout, PageHeader, Panel } from "@/components/ui/panel";
import { Money } from "@/components/money";
import { currentForecastForFund } from "@/server/services/forecast";

export default async function PublishedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = getDb().select().from(schema.publishedSnapshots).where(eq(schema.publishedSnapshots.token, token)).get();
  if (!snap || snap.revokedAt) {
    return <Callout tone="warning" title="Unavailable">Snapshot missing or revoked.</Callout>;
  }
  const payload = JSON.parse(snap.payloadJson) as { asOf?: string; stale?: boolean };
  const current = currentForecastForFund(snap.fundId, payload.asOf ?? "2026-03-31");
  return (
    <div className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Published snapshot (read-only)"
          description="Immutable versioned snapshot. This reader cannot edit records or fetch other LP returns."
        />
        <Callout title="Independent prototype">Synthetic data. {payload.stale ? "This snapshot is older than the live model." : "Versioned copy."}</Callout>
        <Panel className="mt-4 p-4 text-[13px]">
          <div>Fund: {snap.fundId}</div>
          <div>Investor scope: {snap.investorId ?? "general"}</div>
          <div>As of: {payload.asOf}</div>
          <div>
            Remaining modeled (from snapshot-time calculation):{" "}
            {current?.status === "ok" ? <Money value={current.value.modeledRemaining} /> : "n/a"}
          </div>
        </Panel>
      </div>
    </div>
  );
}
