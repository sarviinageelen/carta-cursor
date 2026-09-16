import Link from "next/link";
import type { ReactNode } from "react";

const NAV_SECTIONS: Array<{
  heading: string;
  items: Array<{ href: string; label: string; enabled: boolean }>;
}> = [
  {
    heading: "Firm",
    items: [
      { href: "/home", label: "Firm overview", enabled: true },
      { href: "/funds", label: "Vehicles", enabled: true },
    ],
  },
  {
    heading: "Forecasting & operations",
    items: [
      { href: "/funds", label: "Fund forecasting", enabled: true },
      { href: "#", label: "Deal CRM", enabled: false },
      { href: "#", label: "Capital activity", enabled: false },
      { href: "#", label: "Valuations", enabled: false },
      { href: "#", label: "Waterfalls & carry", enabled: false },
      { href: "#", label: "LP portal", enabled: false },
    ],
  },
];

export function AppShell({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <div className="h-6 w-6 rounded bg-accent" aria-hidden />
          <span className="text-[15px] font-semibold">Carta Fund ERP</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} className="mb-4">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {section.heading}
              </p>
              <ul>
                {section.items.map((item) => (
                  <li key={`${section.heading}-${item.label}`}>
                    {item.enabled ? (
                      <Link
                        href={item.href}
                        className="block rounded px-2 py-1.5 text-[13px] text-ink hover:bg-canvas"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className="flex items-center justify-between rounded px-2 py-1.5 text-[13px] text-muted"
                        title="Planned module — not part of this foundation slice"
                      >
                        {item.label}
                        <span className="rounded bg-canvas px-1 text-[10px] uppercase text-muted">
                          Planned
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-3 text-[11px] text-muted">
          Demo persona: <span className="font-medium text-ink">Fund operations</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-5">
          <div className="min-w-0 text-[13px] text-muted">{breadcrumb}</div>
          <span
            className="shrink-0 rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-medium text-muted"
            title="This is not operated by Carta and holds no real financial data."
          >
            Independent prototype · Synthetic data
          </span>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
