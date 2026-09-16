import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AddEventForm } from "@/components/AddEventForm";
import {
  Breadcrumb,
  Card,
  MetricTile,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { getFund, getInvestment } from "@/server/queries";
import { derivePosition } from "@/domain/portfolio";
import { computeIrr, type DatedCashFlow } from "@/domain/irr";
import {
  formatCurrency,
  formatMultiple,
  formatPercent,
} from "@/components/format";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  invest: "Capital deployment",
  distribution: "Distribution",
  valuation: "Valuation mark",
};

export default async function InvestmentDetailPage({
  params,
}: {
  params: Promise<{ fundId: string; investmentId: string }>;
}) {
  const { fundId, investmentId } = await params;
  const fund = getFund(fundId);
  const investment = getInvestment(investmentId);
  if (!fund || !investment) notFound();

  const pos = derivePosition(investment.status, investment.events);
  const moic = pos.invested.greaterThan(0)
    ? formatMultiple(pos.totalValue.dividedBy(pos.invested))
    : "—";

  // Build a dated cash-flow series for an illustrative gross IRR: deployments
  // are outflows, distributions are inflows, and the latest residual mark is a
  // terminal inflow for still-active positions.
  const cashFlows: DatedCashFlow[] = [];
  for (const e of investment.events) {
    if (e.kind === "invest") {
      cashFlows.push({ date: e.eventDate, amount: -Number(e.amount) });
    } else if (e.kind === "distribution") {
      cashFlows.push({ date: e.eventDate, amount: Number(e.amount) });
    }
  }
  if (investment.status === "active" && pos.residualValue.greaterThan(0)) {
    const lastValuation = [...investment.events]
      .filter((e) => e.kind === "valuation")
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .at(-1);
    if (lastValuation) {
      cashFlows.push({
        date: lastValuation.eventDate,
        amount: pos.residualValue.toNumber(),
      });
    }
  }
  const irr = computeIrr(cashFlows);

  return (
    <AppShell
      breadcrumb={
        <Breadcrumb
          items={[
            { href: "/home", label: "Firm overview" },
            { href: "/funds", label: "Vehicles" },
            { href: `/funds/${fund.id}`, label: fund.name },
            { label: investment.company.name },
          ]}
        />
      }
    >
      <PageHeader
        title={investment.company.name}
        subtitle={`${investment.company.sector} · ${investment.company.hqLocation} · ${investment.entryStage} · Entered ${investment.entryDate}`}
        action={<StatusBadge status={investment.status} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile label="Invested" value={formatCurrency(pos.invested)} />
        <MetricTile label="Distributions" value={formatCurrency(pos.distributions)} />
        <MetricTile label="Residual value" value={formatCurrency(pos.residualValue)} />
        <MetricTile label="Gross MOIC" value={moic} />
        <MetricTile
          label="Gross IRR (ACT/365F)"
          value={irr.status === "ok" ? formatPercent(irr.rate) : "n/a"}
          hint={irr.status === "ok" ? undefined : irr.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title={`Event history (${investment.events.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {investment.events.map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2 tabular">{e.eventDate}</td>
                      <td className="px-4 py-2">{KIND_LABEL[e.kind] ?? e.kind}</td>
                      <td className="px-4 py-2 text-right tabular">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-2 text-muted">{e.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card title="Record a new event">
            <AddEventForm
              investmentId={investment.id}
              fundId={fund.id}
              defaultDate="2026-09-16"
            />
            <p className="border-t border-line px-4 py-3 text-[11px] text-muted">
              Events persist to the local SQLite database and immediately update
              this position and the fund and firm rollups.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
