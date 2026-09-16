import { daysBetween } from "./irr";
import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type LoanInterestInput = {
  principal: string;
  annualRate: string;
  startDate: string;
  endDate: string;
  dayCount: "ACT/365F";
  pik: boolean;
};

export function accrueFixedInterest(input: LoanInterestInput): CalcResult<string> {
  const profile = CALCULATION_PROFILES.loan_fixed_act365f_v1.id;
  if (input.pik) {
    return unavailable("unsupported_configuration", "PIK interest is not implemented in loan_fixed_act365f_v1.", profile);
  }
  if (input.dayCount !== "ACT/365F") {
    return unavailable("unsupported_configuration", "Only ACT/365F is supported in this profile.", profile);
  }
  const days = daysBetween(input.startDate, input.endDate);
  if (days < 0) {
    return unavailable("invalid_chronology", "Accrual end is before start.", profile);
  }
  const interest = dec(input.principal).times(dec(input.annualRate)).times(dec(days)).div(365);
  return ok(interest.toFixed(), profile);
}

export function applyRepayment(principal: string, payment: string, interestDue: string): CalcResult<{
  interestPaid: string;
  principalPaid: string;
  remainingPrincipal: string;
}> {
  const profile = CALCULATION_PROFILES.loan_fixed_act365f_v1.id;
  let remainingPayment = dec(payment);
  const interestPaid = remainingPayment.lt(dec(interestDue)) ? remainingPayment : dec(interestDue);
  remainingPayment = remainingPayment.minus(interestPaid);
  const principalPaid = remainingPayment.lt(dec(principal)) ? remainingPayment : dec(principal);
  const remainingPrincipal = dec(principal).minus(principalPaid);
  return ok(
    {
      interestPaid: interestPaid.toFixed(),
      principalPaid: principalPaid.toFixed(),
      remainingPrincipal: remainingPrincipal.toFixed(),
    },
    profile,
  );
}
