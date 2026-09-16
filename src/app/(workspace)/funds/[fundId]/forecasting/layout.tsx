import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";

export default async function ForecastingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = await params;
  const fund = getDb().select().from(schema.legalEntities).where(eq(schema.legalEntities.id, fundId)).get();
  const items = [
    ["Dashboard", ""],
    ["Construction", "/construction"],
    ["Investments", "/investments"],
    ["Scenarios", "/scenarios"],
    ["Time Machine", "/time-machine"],
    ["Monthly model", "/monthly"],
    ["KPIs", "/kpis"],
    ["Formulas", "/formulas"],
    ["Reserves", "/reserves"],
    ["Documents", "/documents"],
    ["Sharing", "/sharing"],
    ["Integrations", "/integrations"],
  ];
  return (
    <div>
      <div className="mb-4 text-[12px] text-muted">
        <Link href="/funds">Funds</Link> / {fund?.name ?? fundId} / Forecasting
      </div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {items.map(([label, suffix]) => (
          <Link
            key={label}
            href={`/funds/${fundId}/forecasting${suffix}`}
            className="px-3 py-2 text-[13px] text-muted hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
