import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb, Card, PageHeader } from "@/components/ui";
import { listFundsWithSummaries } from "@/server/queries";
import { formatCurrency, multipleOrDash } from "@/components/format";

export const dynamic = "force-dynamic";

export default function FundsPage() {
  const funds = listFundsWithSummaries();

  return (
    <AppShell breadcrumb={<Breadcrumb items={[{ href: "/home", label: "Firm overview" }, { label: "Vehicles" }]} />}>
      <PageHeader
        title="Vehicles"
        subtitle="Funds and SPVs available for forecasting and operations."
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-4 py-2 font-medium">Vehicle</th>
                <th className="px-4 py-2 font-medium">Strategy</th>
                <th className="px-4 py-2 font-medium">Vintage</th>
                <th className="px-4 py-2 text-right font-medium">Committed</th>
                <th className="px-4 py-2 text-right font-medium">Paid-in</th>
                <th className="px-4 py-2 text-right font-medium">DPI</th>
                <th className="px-4 py-2 text-right font-medium">RVPI</th>
                <th className="px-4 py-2 text-right font-medium">TVPI</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(({ fund, summary }) => (
                <tr key={fund.id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-2.5">
                    <Link href={`/funds/${fund.id}`} className="font-medium text-accent hover:underline">
                      {fund.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{fund.strategy}</td>
                  <td className="px-4 py-2.5 tabular">{fund.vintageYear}</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatCurrency(fund.commitment)}</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatCurrency(summary.paidIn)}</td>
                  <td className="px-4 py-2.5 text-right tabular">{multipleOrDash(summary.metrics, "dpi")}</td>
                  <td className="px-4 py-2.5 text-right tabular">{multipleOrDash(summary.metrics, "rvpi")}</td>
                  <td className="px-4 py-2.5 text-right tabular font-medium">{multipleOrDash(summary.metrics, "tvpi")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
