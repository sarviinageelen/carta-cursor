import Link from "next/link";

export default async function OperationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = await params;
  const items = [
    ["Overview", `/funds/${fundId}`],
    ["Calls", `/funds/${fundId}/operations/calls`],
    ["Distributions", `/funds/${fundId}/operations/distributions`],
    ["Ledger", `/funds/${fundId}/operations/ledger`],
    ["Schedule", `/funds/${fundId}/operations/schedule`],
    ["Grouped views", `/funds/${fundId}/operations/reporting`],
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {items.map(([label, href]) => (
          <Link key={href} href={href} className="px-3 py-2 text-[13px] text-muted hover:text-ink">
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
