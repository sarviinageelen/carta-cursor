import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type CompRow = { name: string; multiple: string; weight: string };

export function postMoneyValuation(postMoney: string): CalcResult<string> {
  const profile = CALCULATION_PROFILES.valuation_post_money_v1.id;
  if (dec(postMoney).lt(0)) {
    return unavailable("unsupported_configuration", "Post-money value cannot be negative.", profile);
  }
  return ok(dec(postMoney).toFixed(), profile);
}

export function publicCompsValuation(
  metric: string,
  comps: CompRow[],
  netDebt: string,
): CalcResult<string> {
  const profile = CALCULATION_PROFILES.valuation_public_comps_v1.id;
  if (comps.length === 0) {
    return unavailable("missing_data", "No comparables supplied.", profile);
  }
  const weightSum = comps.reduce((acc, row) => acc.plus(dec(row.weight)), dec(0));
  if (weightSum.isZero()) {
    return unavailable("zero_denominator", "Comparable weights sum to zero.", profile);
  }
  const weighted = comps.reduce((acc, row) => acc.plus(dec(row.multiple).times(dec(row.weight))), dec(0));
  const equity = dec(metric).times(weighted.div(weightSum)).minus(dec(netDebt));
  return ok(equity.toFixed(), profile);
}

export function dcfValuation(input: {
  cashFlows: string[];
  discountRate: string;
  terminalGrowth: string;
}): CalcResult<string> {
  const profile = CALCULATION_PROFILES.valuation_dcf_v1.id;
  const r = dec(input.discountRate);
  const g = dec(input.terminalGrowth);
  if (r.lte(g)) {
    return unavailable("unsupported_configuration", "Discount rate must exceed terminal growth.", profile);
  }
  if (input.cashFlows.length === 0) {
    return unavailable("missing_data", "DCF requires projected cash flows.", profile);
  }
  let pv = dec(0);
  input.cashFlows.forEach((flow, index) => {
    pv = pv.plus(dec(flow).div(dec(1).plus(r).pow(index + 1)));
  });
  const last = dec(input.cashFlows[input.cashFlows.length - 1]);
  const terminal = last.times(dec(1).plus(g)).div(r.minus(g));
  const terminalPv = terminal.div(dec(1).plus(r).pow(input.cashFlows.length));
  return ok(pv.plus(terminalPv).toFixed(), profile);
}

export function blendValuation(weights: Array<{ method: string; value: string; weight: string }>): CalcResult<string> {
  const eligible = weights.filter((row) => row.method !== "opm" && row.method !== "backsolve");
  const skipped = weights.filter((row) => row.method === "opm" || row.method === "backsolve");
  const weightSum = eligible.reduce((acc, row) => acc.plus(dec(row.weight)), dec(0));
  if (weightSum.isZero()) {
    return unavailable(
      "unsupported_configuration",
      skipped.length
        ? "OPM/backsolve is unsupported and remaining methods have zero weight."
        : "Valuation weights sum to zero.",
      CALCULATION_PROFILES.valuation_opm_unsupported.id,
    );
  }
  const blended = eligible.reduce((acc, row) => acc.plus(dec(row.value).times(dec(row.weight))), dec(0)).div(weightSum);
  return ok(blended.toFixed(), "valuation_blended_supported_v1", skipped.length ? ["OPM/backsolve weight ignored as unsupported."] : []);
}

export function fundOwnershipValue(companyEquity: string, ownership: string): string {
  return dec(companyEquity).times(dec(ownership)).toFixed();
}
