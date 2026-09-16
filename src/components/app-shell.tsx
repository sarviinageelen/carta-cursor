"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/server/auth/session";
import { switchPersona } from "@/app/actions";

const NAV = [
  { href: "/home", label: "Home", modules: ["home"] },
  { href: "/funds", label: "Funds", modules: ["funds"] },
  { href: "/crm/deals", label: "Deal CRM", modules: ["crm"] },
  { href: "/crm/investors", label: "LP CRM", modules: ["crm"] },
  { href: "/fundraising", label: "Fundraising", modules: ["crm"] },
  { href: "/portfolio", label: "Portfolio", modules: ["portfolio"] },
  { href: "/data-collection", label: "Data collection", modules: ["portfolio"] },
  { href: "/valuations", label: "Valuations", modules: ["portfolio"] },
  { href: "/waterfalls", label: "Waterfalls", modules: ["structure"] },
  { href: "/carry", label: "GP carry", modules: ["structure"] },
  { href: "/tax", label: "Tax", modules: ["tax"] },
  { href: "/audit", label: "Audit", modules: ["audit"] },
  { href: "/kyc", label: "KYC", modules: ["kyc"] },
  { href: "/management-company", label: "ManCo", modules: ["manco"] },
  { href: "/spvs", label: "SPVs", modules: ["spv"] },
  { href: "/lp", label: "LP Portal", modules: ["lp"] },
  { href: "/allocator", label: "Allocator", modules: ["allocator"] },
  { href: "/loans", label: "Loans", modules: ["loans"] },
  { href: "/data-explorer", label: "Data explorer", modules: ["analytics"] },
  { href: "/integrations", label: "Integrations", modules: ["admin"] },
  { href: "/settings", label: "Settings", modules: ["admin"] },
  { href: "/activity", label: "Activity", modules: ["admin"] },
];

export function AppShell({
  user,
  users,
  children,
}: {
  user: SessionUser;
  users: Array<{ id: string; displayName: string; persona: string }>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const filtered = NAV.filter((item) => {
    if (user.persona === "lp") return item.href === "/lp";
    if (user.persona === "company_submitter") return item.href === "/data-collection";
    if (user.persona === "auditor") return ["/home", "/audit"].includes(item.href);
    if (user.persona === "borrower") return item.href === "/loans";
    return true;
  });

  return (
    <div className="min-h-screen">
      <div className="flex h-7 items-center justify-center bg-accent text-[11px] text-white">
        Carta Fund ERP independent prototype · Synthetic data · Not operated by Carta
      </div>
      <header className="flex h-14 items-center gap-4 border-b border-line bg-panel px-4">
        <Link href="/home" className="text-[15px] font-semibold">
          Carta Fund ERP
        </Link>
        <div className="text-[12px] text-muted">Northbridge Capital · demo clock 2026-09-16</div>
        <div className="ml-auto flex items-center gap-2">
          <form action={switchPersona} className="flex items-center gap-2">
            <span className="text-[12px] text-muted">Persona</span>
            <select name="userId" defaultValue={user.id} className="h-8 rounded-[6px] border border-line bg-white px-2 text-[12px]">
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
            <Button variant="secondary">Switch</Button>
          </form>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-84px)]">
        <aside className="w-[232px] shrink-0 border-r border-line bg-panel">
          <nav className="flex flex-col py-2">
            {filtered.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-1.5 text-[13px] text-muted hover:bg-paper hover:text-ink",
                  pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-accent-soft font-medium text-accent" : "",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
