import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb, Card, MetricTile, PageHeader, StatusBadge } from "@/components/ui";
import {
  computeFundSummary,
  getFund,
  listInvestmentsForFund,
  positionForRow,
} from "@/server/queries";
import { formatCurrency, formatMultiple, multipleOrDash } from "@/components/format";

export const dynamic = "force-dynamic";

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = await params;
  const fund = getFund(fundId);
  if (!fund) notFound();

  const summary = computeFundSummary(fundId);
  const investments = listInvestmentsForFund(fundId);

  return (
    <AppShell
      breadcrumb={
        <Breadcrumb
          items={[
            { href: "/home", label: "Firm overview" },
            { href: "/funds", label: "Vehicles" },
            { label: fund.name },
          ]}
        />
      }
    >
      <PageHeader
        title={fund.name}
        subtitle={`${fund.strategy} · Vintage ${fund.vintageYear} · Inception ${fund.inceptionDate}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricTile label="Committed" value={formatCurrency(fund.commitment)} />
        <MetricTile label="Paid-in" value={formatCurrency(summary.paidIn)} />
        <MetricTile label="Distributions" value={formatCurrency(summary.distributions)} />
        <MetricTile label="Residual value" value={formatCurrency(summary.residualValue)} />
        <MetricTile
          label="TVPI"
          value={multipleOrDash(summary.metrics, "tvpi")}
          hint={`DPI ${multipleOrDash(summary.metrics, "dpi")} · RVPI ${multipleOrDash(summary.metrics, "rvpi")}`}
        />
      </div>

      <Card
        title={`Investments (${investments.length})`}
        right={
          <span className="text-[12px] text-muted">
            {summary.activeCount} active · {summary.realizedCount} realized · {summary.writtenOffCount} written off
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Invested</th>
                <th className="px-4 py-2 text-right font-medium">Distributions</th>
                <th className="px-4 py-2 text-right font-medium">Residual value</th>
                <th className="px-4 py-2 text-right font-medium">Gross MOIC</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {investments.map((row) => {
                const pos = positionForRow(row);
                const moic = pos.invested.greaterThan(0)
                  ? formatMultiple(pos.totalValue.dividedBy(pos.invested))
                  : "—";
                return (
                  <tr key={row.id} className="border-b border-line last:border-0 hover:bg-canvas">
                    <td className="px-4 py-2.5 font-medium">{row.company.name}</td>
                    <td className="px-4 py-2.5 text-muted">{row.entryStage}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-2.5 text-right tabular">{formatCurrency(pos.invested)}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatCurrency(pos.distributions)}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatCurrency(pos.residualValue)}</td>
                    <td className="px-4 py-2.5 text-right tabular font-medium">{moic}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/funds/${fund.id}/investments/${row.id}`}
                        className="text-[12px] text-accent hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
