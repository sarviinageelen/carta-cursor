import { daysBetween } from "./irr";
import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type EuropeanWaterfallInput = {
  contributedCapital: string;
  gpCommitment: string;
  distributableProceeds: string;
  preferredRate: string;
  catchUp: boolean;
  carryRate: string;
  contributionDate: string;
  distributionDate: string;
};

export type WaterfallTier = {
  name: string;
  lpAmount: string;
  gpAmount: string;
};

export type EuropeanWaterfallResult = {
  profile: string;
  tiers: WaterfallTier[];
  lpTotal: string;
  gpTotal: string;
  gpAsLpReturnOfCapital: string;
  gpCarry: string;
};

export function europeanWholeFundWaterfall(
  input: EuropeanWaterfallInput,
): CalcResult<EuropeanWaterfallResult> {
  const profile = CALCULATION_PROFILES.fund_waterfall_european_v1.id;
  const contributed = dec(input.contributedCapital);
  const gpCommit = dec(input.gpCommitment);
  const proceeds = dec(input.distributableProceeds);
  const prefRate = dec(input.preferredRate);
  const carry = dec(input.carryRate);
  if (contributed.lt(0) || proceeds.lt(0) || gpCommit.lt(0)) {
    return unavailable("unsupported_configuration", "Negative capital or proceeds are not supported.", profile);
  }
  if (carry.lt(0) || carry.gt(1) || prefRate.lt(0)) {
    return unavailable("unsupported_configuration", "Carry must be in [0,1] and preferred rate must be >= 0.", profile);
  }
  if (gpCommit.gt(contributed)) {
    return unavailable("unsupported_configuration", "GP commitment cannot exceed total contributed capital.", profile);
  }
  const lpCommit = contributed.minus(gpCommit);
  const years = dec(daysBetween(input.contributionDate, input.distributionDate)).div(365);
  if (years.lt(0)) {
    return unavailable("invalid_chronology", "Distribution date is before contribution date.", profile);
  }

  let remaining = proceeds;
  const tiers: WaterfallTier[] = [];

  const rocLp = min(remaining, lpCommit);
  remaining = remaining.minus(rocLp);
  const rocGp = min(remaining, gpCommit);
  remaining = remaining.minus(rocGp);
  tiers.push({ name: "Return of capital", lpAmount: rocLp.toFixed(), gpAmount: rocGp.toFixed() });

  const prefAmount = lpCommit.times(prefRate).times(years);
  const prefPaid = min(remaining, prefAmount);
  remaining = remaining.minus(prefPaid);
  tiers.push({ name: "Preferred return", lpAmount: prefPaid.toFixed(), gpAmount: "0" });

  let catchUpPaid = dec(0);
  if (input.catchUp && carry.gt(0)) {
    const catchUpTarget = prefPaid.times(carry).div(dec(1).minus(carry));
    catchUpPaid = min(remaining, catchUpTarget);
    remaining = remaining.minus(catchUpPaid);
    tiers.push({ name: "GP catch-up", lpAmount: "0", gpAmount: catchUpPaid.toFixed() });
  }

  const residualLp = remaining.times(dec(1).minus(carry));
  const residualGp = remaining.times(carry);
  remaining = dec(0);
  tiers.push({
    name: "Carried interest split",
    lpAmount: residualLp.toFixed(),
    gpAmount: residualGp.toFixed(),
  });

  const lpTotal = rocLp.plus(prefPaid).plus(residualLp);
  const gpCarry = catchUpPaid.plus(residualGp);
  const gpTotal = rocGp.plus(gpCarry);
  return ok(
    {
      profile,
      tiers,
      lpTotal: lpTotal.toFixed(),
      gpTotal: gpTotal.toFixed(),
      gpAsLpReturnOfCapital: rocGp.toFixed(),
      gpCarry: gpCarry.toFixed(),
    },
    profile,
  );
}

function min(a: ReturnType<typeof dec>, b: ReturnType<typeof dec>) {
  return a.lt(b) ? a : b;
}

export function americanWaterfallUnsupported() {
  return unavailable(
    "unsupported_configuration",
    "American/deal-by-deal waterfall is not implemented. Select european_whole_fund_v1.",
    CALCULATION_PROFILES.fund_waterfall_american_unsupported.id,
  );
}
