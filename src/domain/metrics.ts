import Decimal from "decimal.js";
import { money } from "./money";
import { ok, unavailable, type Result } from "./result";

export interface LpBasisInputs {
  paidIn: string | number | Decimal;
  distributions: string | number | Decimal;
  residualValue: string | number | Decimal;
}

export interface LpMetrics {
  paidIn: Decimal;
  distributions: Decimal;
  residualValue: Decimal;
  dpi: Decimal;
  rvpi: Decimal;
  tvpi: Decimal;
}

/**
 * LP-basis multiples on a single, consistent paid-in denominator.
 *   DPI  = distributions / paidIn
 *   RVPI = residualValue / paidIn
 *   TVPI = (distributions + residualValue) / paidIn = DPI + RVPI
 * A zero or negative paid-in denominator yields an explicit unavailable result.
 */
export function computeLpMetrics(inputs: LpBasisInputs): Result<LpMetrics> {
  const paidIn = money(inputs.paidIn);
  const distributions = money(inputs.distributions);
  const residualValue = money(inputs.residualValue);

  if (paidIn.lessThanOrEqualTo(0)) {
    return unavailable("Paid-in capital is zero; ratios are undefined.");
  }

  const dpi = distributions.dividedBy(paidIn);
  const rvpi = residualValue.dividedBy(paidIn);
  const tvpi = distributions.plus(residualValue).dividedBy(paidIn);

  return ok({ paidIn, distributions, residualValue, dpi, rvpi, tvpi });
}
