import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/money";
import { Metric, PageHeader, Panel } from "@/components/ui/panel";
import { getDb, schema } from "@/server/db";
import { constructionForecastForFund, currentForecastForFund } from "@/server/services/forecast";
import { today } from "@/server/clock";

export default async function FundPage({ params }: { params: Promise<{ fundId: string }> }) {
  const { fundId } = await params;
  const fund = getDb().select().from(schema.legalEntities).where(eq(schema.legalEntities.id, fundId)).get();
  if (!fund) notFound();
  const construction = constructionForecastForFund(fundId);
  const current = currentForecastForFund(fundId, today());
  return (
    <div>
      <PageHeader
        eyebrow={fund.kind}
        title={fund.name}
        description={`${fund.legalName} · ${fund.currency} · inception ${fund.inceptionDate ?? "n/a"}`}
        actions={
          <div className="flex gap-2 text-[13px]">
            <Link className="text-accent" href={`/funds/${fundId}/forecasting`}>
              Forecasting
            </Link>
            <Link className="text-accent" href={`/funds/${fundId}/operations/calls`}>
              Capital calls
            </Link>
            <Link className="text-accent" href={`/funds/${fundId}/operations/distributions`}>
              Distributions
            </Link>
            <Link className="text-accent" href={`/funds/${fundId}/operations/ledger`}>
              Ledger
            </Link>
          </div>
        }
      />
      <Panel className="mb-4 flex flex-wrap">
        <Metric label="Commitments" value={<Money value={fund.commitments} />} />
        <Metric label="GP commitment" value={<Money value={fund.gpCommitment} />} />
        <Metric
          label="Construction deals"
          value={construction?.status === "ok" ? Number(construction.value.projectedDealCount).toFixed(2) : "n/a"}
          hint="Inception model"
        />
        <Metric
          label="Current actual invested"
          value={current?.status === "ok" ? <Money value={current.value.actualInvested} /> : "n/a"}
          hint="Does not rewrite construction"
        />
      </Panel>
      <Panel className="p-4 text-[13px] text-muted">
        <Badge>{fund.strategyTemplate ?? "custom"}</Badge>
        <p className="mt-2">
          Evergreen: {fund.evergreen ? "yes — horizon is an assumption, not a known terminal value" : "no"}. No-construction:{" "}
          {fund.noConstruction ? "yes — does not legally form an SPV" : "no"}.
        </p>
      </Panel>
    </div>
  );
}
