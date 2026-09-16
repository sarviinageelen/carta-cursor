import Decimal from "decimal.js";
import { money, sum } from "./money";
import { computeLpMetrics, type LpMetrics } from "./metrics";
import type { Result } from "./result";

export type PositionStatus = "active" | "realized" | "written_off";

export interface PositionEvent {
  kind: string; // "invest" | "distribution" | "valuation"
  amount: string | number | Decimal;
  eventDate: string;
}

export interface PositionSummary {
  invested: Decimal;
  distributions: Decimal;
  /** Current unrealized mark. Zero for realized or written-off positions. */
  residualValue: Decimal;
  totalValue: Decimal; // distributions + residualValue
}

/**
 * Derive a single investment's position from its dated events. The residual
 * value is the most recent valuation mark; realized and written-off positions
 * carry zero residual regardless of a stale mark.
 */
export function derivePosition(
  status: PositionStatus,
  events: PositionEvent[],
): PositionSummary {
  const invested = sum(
    events.filter((e) => e.kind === "invest").map((e) => e.amount),
  );
  const distributions = sum(
    events.filter((e) => e.kind === "distribution").map((e) => e.amount),
  );

  let residualValue = new Decimal(0);
  if (status === "active") {
    const valuations = events
      .filter((e) => e.kind === "valuation")
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const latest = valuations[valuations.length - 1];
    residualValue = latest ? money(latest.amount) : new Decimal(0);
  }

  return {
    invested,
    distributions,
    residualValue,
    totalValue: distributions.plus(residualValue),
  };
}

export interface FundSummary {
  paidIn: Decimal;
  distributions: Decimal;
  residualValue: Decimal;
  activeCount: number;
  realizedCount: number;
  writtenOffCount: number;
  metrics: Result<LpMetrics>;
}

export interface InvestmentWithEvents {
  status: PositionStatus;
  events: PositionEvent[];
}

/**
 * Aggregate a fund's positions into paid-in, distributions and residual value,
 * then compute LP-basis multiples on the shared paid-in denominator.
 */
export function deriveFundSummary(
  investments: InvestmentWithEvents[],
): FundSummary {
  let paidIn = new Decimal(0);
  let distributions = new Decimal(0);
  let residualValue = new Decimal(0);
  let activeCount = 0;
  let realizedCount = 0;
  let writtenOffCount = 0;

  for (const inv of investments) {
    const pos = derivePosition(inv.status, inv.events);
    paidIn = paidIn.plus(pos.invested);
    distributions = distributions.plus(pos.distributions);
    residualValue = residualValue.plus(pos.residualValue);
    if (inv.status === "active") activeCount++;
    else if (inv.status === "realized") realizedCount++;
    else writtenOffCount++;
  }

  return {
    paidIn,
    distributions,
    residualValue,
    activeCount,
    realizedCount,
    writtenOffCount,
    metrics: computeLpMetrics({ paidIn, distributions, residualValue }),
  };
}
