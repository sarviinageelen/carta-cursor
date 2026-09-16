import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-[8px] border border-line bg-panel", className)}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? <div className="text-[12px] uppercase tracking-[0.08em] text-muted">{eyebrow}</div> : null}
        <h1 className="text-[24px] font-semibold leading-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-[140px] border-r border-line px-4 py-3 last:border-r-0">
      <div className="text-[11px] uppercase tracking-[0.06em] text-muted">{label}</div>
      <div className="mt-1 font-medium tabular-nums text-[18px]">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-[13px] text-muted">{body}</p>
    </div>
  );
}

export function Callout({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "info" | "warning";
}) {
  return (
    <div className={cn("rounded-[6px] border px-3 py-2 text-[12px]", tone === "warning" ? "border-[#ead9a8] bg-[#fbf6e8]" : "border-line bg-[#f7f8f5]")}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}
