import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb, Card, MetricTile, PageHeader } from "@/components/ui";
import { getFirm, listFundsWithSummaries } from "@/server/queries";
import { formatCurrency, multipleOrDash } from "@/components/format";
import { computeLpMetrics } from "@/domain/metrics";
import { sum } from "@/domain/money";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const firm = getFirm();
  const fundsWithSummaries = listFundsWithSummaries();

  const committed = sum(fundsWithSummaries.map(({ fund }) => fund.commitment));
  const paidIn = sum(fundsWithSummaries.map(({ summary }) => summary.paidIn));
  const distributions = sum(
    fundsWithSummaries.map(({ summary }) => summary.distributions),
  );
  const residual = sum(
    fundsWithSummaries.map(({ summary }) => summary.residualValue),
  );

  const firmMetrics = computeLpMetrics({
    paidIn,
    distributions,
    residualValue: residual,
  });

  return (
    <AppShell breadcrumb={<Breadcrumb items={[{ label: "Firm overview" }]} />}>
      <PageHeader
        title={firm?.name ?? "Firm overview"}
        subtitle="Consolidated USD position across all synthetic vehicles. Every figure is derived from recorded investment events."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Committed capital"
          value={formatCurrency(committed)}
          hint={`${fundsWithSummaries.length} vehicles`}
        />
        <MetricTile label="Paid-in (deployed)" value={formatCurrency(paidIn)} />
        <MetricTile label="Distributions" value={formatCurrency(distributions)} />
        <MetricTile
          label="Net TVPI"
          value={multipleOrDash(firmMetrics, "tvpi")}
          hint={`DPI ${multipleOrDash(firmMetrics, "dpi")} · RVPI ${multipleOrDash(firmMetrics, "rvpi")}`}
        />
      </div>

      <Card title="Vehicles">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-4 py-2 font-medium">Vehicle</th>
                <th className="px-4 py-2 font-medium">Vintage</th>
                <th className="px-4 py-2 text-right font-medium">Committed</th>
                <th className="px-4 py-2 text-right font-medium">Paid-in</th>
                <th className="px-4 py-2 text-right font-medium">Distributions</th>
                <th className="px-4 py-2 text-right font-medium">Residual value</th>
                <th className="px-4 py-2 text-right font-medium">TVPI</th>
              </tr>
            </thead>
            <tbody>
              {fundsWithSummaries.map(({ fund, summary }) => (
                <tr
                  key={fund.id}
                  className="border-b border-line last:border-0 hover:bg-canvas"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/funds/${fund.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {fund.name}
                    </Link>
                    <div className="text-[12px] text-muted">{fund.strategy}</div>
                  </td>
                  <td className="px-4 py-2.5 tabular">{fund.vintageYear}</td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {formatCurrency(fund.commitment)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {formatCurrency(summary.paidIn)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {formatCurrency(summary.distributions)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {formatCurrency(summary.residualValue)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular font-medium">
                    {multipleOrDash(summary.metrics, "tvpi")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-[11px] text-muted">
        Independent prototype using synthetic data. Not affiliated with Carta and
        not connected to any real financial account.
      </p>
    </AppShell>
  );
}
