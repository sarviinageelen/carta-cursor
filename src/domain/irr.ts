// Dated IRR under an explicit ACT/365F day-count convention. This is our
// prototype convention, documented in docs/IMPLEMENTATION_NOTES.md, not a claim
// of parity with any proprietary fund-accounting engine.

export interface DatedCashFlow {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Signed amount: negative = outflow, positive = inflow. */
  amount: number;
}

export type IrrResult =
  | { status: "ok"; rate: number; warnings: string[] }
  | { status: "no_cashflows"; message: string }
  | { status: "no_sign_change"; message: string }
  | { status: "no_solution"; message: string }
  | { status: "non_converged"; message: string };

const MS_PER_DAY = 86_400_000;
const DAY_COUNT_BASIS = 365; // ACT/365F
const TOLERANCE = 1e-9;
const MAX_ITERATIONS = 200;

function yearFraction(fromISO: string, toISO: string): number {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  return (to - from) / MS_PER_DAY / DAY_COUNT_BASIS;
}

function npv(rate: number, times: number[], amounts: number[]): number {
  let total = 0;
  for (let i = 0; i < times.length; i++) {
    total += amounts[i]! / Math.pow(1 + rate, times[i]!);
  }
  return total;
}

/**
 * Compute the internal rate of return for dated cash flows. Root finding uses a
 * sign-bracketed bisection for robustness. A single sign change guarantees a
 * unique root; multiple sign changes are surfaced as a warning rather than an
 * assertion that multiple real roots exist.
 */
export function computeIrr(cashFlows: DatedCashFlow[]): IrrResult {
  if (cashFlows.length === 0) {
    return { status: "no_cashflows", message: "No cash flows supplied." };
  }

  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));
  const base = sorted[0]!.date;
  const times = sorted.map((cf) => yearFraction(base, cf.date));
  const amounts = sorted.map((cf) => cf.amount);

  const hasPositive = amounts.some((a) => a > 0);
  const hasNegative = amounts.some((a) => a < 0);
  if (!hasPositive || !hasNegative) {
    return {
      status: "no_sign_change",
      message: "Cash flows must contain both an outflow and an inflow.",
    };
  }

  const warnings: string[] = [];
  let signChanges = 0;
  let prev = 0;
  for (const a of amounts) {
    if (a === 0) continue;
    const s = a > 0 ? 1 : -1;
    if (prev !== 0 && s !== prev) signChanges++;
    prev = s;
  }
  if (signChanges > 1) {
    warnings.push(
      `Cash-flow signs change ${signChanges} times; the IRR may not be unique.`,
    );
  }

  // Bracket a root by scanning rates from just above -100% upward.
  const lowerBound = -0.9999;
  let a = lowerBound;
  let fa = npv(a, times, amounts);
  let bracketLo = NaN;
  let bracketHi = NaN;
  const step = 0.01;
  for (let r = lowerBound + step; r <= 100; r += step) {
    const fr = npv(r, times, amounts);
    if (fa === 0) {
      return { status: "ok", rate: a, warnings };
    }
    if ((fa < 0 && fr > 0) || (fa > 0 && fr < 0)) {
      bracketLo = a;
      bracketHi = r;
      break;
    }
    a = r;
    fa = fr;
  }

  if (Number.isNaN(bracketLo)) {
    return {
      status: "no_solution",
      message: "No sign change of NPV was found across the search range.",
    };
  }

  let lo = bracketLo;
  let hi = bracketHi;
  let fLo = npv(lo, times, amounts);
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, times, amounts);
    if (Math.abs(fMid) < TOLERANCE || (hi - lo) / 2 < TOLERANCE) {
      return { status: "ok", rate: mid, warnings };
    }
    if ((fLo < 0 && fMid < 0) || (fLo > 0 && fMid > 0)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }

  return {
    status: "non_converged",
    message: "Root finding did not converge within the iteration budget.",
  };
}
