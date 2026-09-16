import { dec, type Decimal } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type DatedCashFlow = {
  date: string;
  amount: string;
};

export type IrrValue = {
  rate: string;
  yearFractionConvention: "ACT/365F";
  signChanges: number;
};

const PROFILE = CALCULATION_PROFILES.irr_act365f_v1.id;
const MAX_ITER = 80;
const TOLERANCE = dec("1e-12");

export function daysBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error(`Invalid date in cash flow: ${start} / ${end}`);
  }
  return Math.round((b - a) / 86_400_000);
}

export function countSignChanges(flows: DatedCashFlow[]): number {
  const signs = flows
    .map((flow) => dec(flow.amount))
    .filter((amount) => !amount.isZero())
    .map((amount) => (amount.gt(0) ? 1 : -1));
  let changes = 0;
  for (let i = 1; i < signs.length; i += 1) {
    if (signs[i] !== signs[i - 1]) changes += 1;
  }
  return changes;
}

function npv(rate: Decimal, flows: DatedCashFlow[], origin: string): Decimal {
  const one = dec(1);
  return flows.reduce((acc, flow) => {
    const t = dec(daysBetween(origin, flow.date)).div(365);
    const denom = one.plus(rate).pow(t.toNumber());
    return acc.plus(dec(flow.amount).div(denom));
  }, dec(0));
}

function npvDerivative(rate: Decimal, flows: DatedCashFlow[], origin: string): Decimal {
  const one = dec(1);
  return flows.reduce((acc, flow) => {
    const t = dec(daysBetween(origin, flow.date)).div(365);
    const tNum = t.toNumber();
    if (t.isZero()) return acc;
    const denom = one.plus(rate).pow(tNum + 1);
    return acc.minus(dec(flow.amount).times(t).div(denom));
  }, dec(0));
}

export function irrAct365F(flows: DatedCashFlow[]): CalcResult<IrrValue> {
  if (flows.length === 0) {
    return unavailable("missing_data", "No cash flows supplied.", PROFILE);
  }
  const ordered = [...flows].sort((a, b) => a.date.localeCompare(b.date));
  const origin = ordered[0].date;
  const signs = countSignChanges(ordered);
  const warnings: string[] = [];
  if (signs > 1) {
    warnings.push("Multiple sign changes: the IRR may not be unique.");
  }
  if (signs === 0) {
    return unavailable("no_solution", "Cash flows do not change sign; IRR is undefined.", PROFILE, warnings);
  }

  let low = dec("-0.9999");
  let high = dec("10");
  let npvLow = npv(low, ordered, origin);
  let npvHigh = npv(high, ordered, origin);
  if (npvLow.times(npvHigh).gt(0)) {
    high = dec("100");
    npvHigh = npv(high, ordered, origin);
    if (npvLow.times(npvHigh).gt(0)) {
      return unavailable("no_solution", "IRR did not bracket a root in [-99.99%, 10,000%].", PROFILE, warnings);
    }
  }

  let guess = low.plus(high).div(2);
  for (let i = 0; i < MAX_ITER; i += 1) {
    const value = npv(guess, ordered, origin);
    if (value.abs().lte(TOLERANCE)) {
      return ok(
        { rate: guess.toFixed(), yearFractionConvention: "ACT/365F", signChanges: signs },
        PROFILE,
        warnings,
      );
    }
    const deriv = npvDerivative(guess, ordered, origin);
    if (!deriv.isZero()) {
      const newton = guess.minus(value.div(deriv));
      if (newton.gt(low) && newton.lt(high)) {
        guess = newton;
        continue;
      }
    }
    if (npvLow.times(value).lt(0)) {
      high = guess;
      npvHigh = value;
    } else {
      low = guess;
      npvLow = value;
    }
    guess = low.plus(high).div(2);
  }

  const finalValue = npv(guess, ordered, origin);
  if (finalValue.abs().lte(dec("1e-8"))) {
    return ok(
      { rate: guess.toFixed(), yearFractionConvention: "ACT/365F", signChanges: signs },
      PROFILE,
      [...warnings, "Solver reached tolerance at iteration cap."],
    );
  }
  return unavailable("nonconverged", "IRR solver did not converge.", PROFILE, warnings);
}
