import { dec, isZero, type Amount } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type MultipleBasis = {
  paidIn: Amount;
  distributions: Amount;
  residualValue: Amount;
};

export type PerformanceMultiples = {
  dpi: string;
  rvpi: string;
  tvpi: string;
  basis: "lp_matched_v1";
};

export function performanceMultiples(input: MultipleBasis): CalcResult<PerformanceMultiples> {
  const profile = CALCULATION_PROFILES.lp_multiples_matched_v1.id;
  const paidIn = dec(input.paidIn);
  if (isZero(paidIn)) {
    return unavailable("zero_denominator", "Paid-in capital is zero; ratios are unavailable.", profile);
  }
  const distributions = dec(input.distributions);
  const residual = dec(input.residualValue);
  const dpi = distributions.div(paidIn);
  const rvpi = residual.div(paidIn);
  const tvpi = distributions.plus(residual).div(paidIn);
  return ok(
    {
      dpi: dpi.toFixed(),
      rvpi: rvpi.toFixed(),
      tvpi: tvpi.toFixed(),
      basis: "lp_matched_v1",
    },
    profile,
  );
}

export function grossMoic(invested: Amount, realized: Amount, unrealized: Amount): CalcResult<string> {
  const profile = "gross_investment_moic_v1";
  if (isZero(invested)) {
    return unavailable("zero_denominator", "Invested capital is zero; MOIC is unavailable.", profile);
  }
  return ok(dec(realized).plus(dec(unrealized)).div(dec(invested)).toFixed(), profile);
}
