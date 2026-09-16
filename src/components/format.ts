import type { CurrencyCode } from "@/domain/money";
import { formatCurrency, formatMultiple, formatPercent } from "@/domain/money";
import type { Result } from "@/domain/result";
import type { LpMetrics } from "@/domain/metrics";

export { formatCurrency, formatMultiple, formatPercent };
export type { CurrencyCode };

export function multipleOrDash(
  metrics: Result<LpMetrics>,
  key: "dpi" | "rvpi" | "tvpi",
): string {
  if (!metrics.available) return "—";
  return formatMultiple(metrics.value[key]);
}
