import { cn } from "@/lib/utils";
import { dec } from "@/domain/money";

export function money(value: string | number | null | undefined, currency = "USD") {
  if (value == null || value === "") return "—";
  try {
    const amount = dec(value);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount.toNumber());
    return formatted;
  } catch {
    return "—";
  }
}

export function moneyExact(value: string | number | null | undefined, currency = "USD") {
  if (value == null || value === "") return "—";
  try {
    const amount = dec(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount.toNumber());
  } catch {
    return "—";
  }
}

export function multiple(value: string | number | null | undefined) {
  if (value == null || value === "") return "n/a";
  return `${dec(value).toFixed(2)}x`;
}

export function pct(value: string | number | null | undefined) {
  if (value == null || value === "") return "n/a";
  return `${dec(value).times(100).toFixed(1)}%`;
}

export function Unavailable({ children }: { children: React.ReactNode }) {
  return <span className="text-muted">{children}</span>;
}

export function Money({
  value,
  currency = "USD",
  className,
  exact = false,
}: {
  value: string | number | null | undefined;
  currency?: string;
  className?: string;
  exact?: boolean;
}) {
  return <span className={cn("tabular-nums", className)}>{exact ? moneyExact(value, currency) : money(value, currency)}</span>;
}
