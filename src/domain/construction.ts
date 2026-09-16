import { addMonths, format, parseISO } from "date-fns";
import { allocateByWeights, dec, type Amount } from "./money";
import { validateStageProbabilities } from "./probabilities";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type ConstructionStage = {
  id: string;
  name: string;
  sortOrder: number;
  graduation: string;
  exit: string;
  monthsToNext: number;
  monthsToExit: number;
  exitValue: string;
  optionPoolDilution: string;
  followOnCheck: string;
};

export type ConstructionAllocation = {
  id: string;
  name: string;
  entryStageId: string;
  budget: string;
  initialCheck: string;
  initialOwnership: string;
  followOnParticipation: boolean;
  horizonMonths: number;
};

export type ConstructionPlan = {
  inceptionDate: string;
  currency: string;
  commitments: string;
  gpCommitment: string;
  allocations: ConstructionAllocation[];
  stagesByProfile: Record<string, ConstructionStage[]>;
  allocationProfileId: Record<string, string>;
};

export type AllocationProjection = {
  allocationId: string;
  expectedCostPerCompany: string;
  projectedDealCount: string;
  initialDeployed: string;
  expectedFollowOn: string;
  expectedExitProceeds: string;
  monthlyInitialPacing: Array<{ month: string; amount: string }>;
};

export type ConstructionForecast = {
  profile: string;
  currency: string;
  projectedDealCount: string;
  totalExpectedInvested: string;
  totalExpectedExits: string;
  allocations: AllocationProjection[];
};

function stagePath(stages: ConstructionStage[]): CalcResult<ConstructionStage[]> {
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  for (let i = 0; i < ordered.length; i += 1) {
    const stage = ordered[i];
    const validated = validateStageProbabilities({
      graduation: stage.graduation,
      exit: stage.exit,
      isTerminal: i === ordered.length - 1,
    });
    if (validated.status !== "ok") return validated;
  }
  return ok(ordered, CALCULATION_PROFILES.stage_probability_v1.id);
}

export function expectedFollowOnCost(
  stages: ConstructionStage[],
  entryStageId: string,
): CalcResult<Amount> {
  const ordered = stagePath(stages);
  if (ordered.status !== "ok") return ordered;
  const entryIndex = ordered.value.findIndex((stage) => stage.id === entryStageId);
  if (entryIndex < 0) {
    return unavailable("missing_data", "Entry stage is not in the profile.", "construction_expected_cf_v1");
  }
  let expected = dec(0);
  let pEnter = dec(1);
  for (let i = entryIndex + 1; i < ordered.value.length; i += 1) {
    const prior = ordered.value[i - 1];
    pEnter = pEnter.times(dec(prior.graduation));
    expected = expected.plus(pEnter.times(dec(ordered.value[i].followOnCheck)));
  }
  return ok(expected.toFixed(), CALCULATION_PROFILES.construction_expected_cf_v1.id);
}

function ownershipAfterDilution(stages: ConstructionStage[], entryIndex: number, exitIndex: number, initialOwnership: string) {
  let ownership = dec(initialOwnership);
  for (let i = entryIndex; i < exitIndex; i += 1) {
    ownership = ownership.times(dec(1).minus(dec(stages[i].optionPoolDilution)));
  }
  return ownership;
}

export function projectAllocation(
  plan: ConstructionPlan,
  allocation: ConstructionAllocation,
): CalcResult<AllocationProjection> {
  const profileId = plan.allocationProfileId[allocation.id];
  const stages = plan.stagesByProfile[profileId] ?? [];
  const ordered = stagePath(stages);
  if (ordered.status !== "ok") return ordered;
  const entryIndex = ordered.value.findIndex((stage) => stage.id === allocation.entryStageId);
  if (entryIndex < 0) {
    return unavailable("missing_data", `Allocation ${allocation.id} has an unknown entry stage.`, "construction_expected_cf_v1");
  }
  const followOn = allocation.followOnParticipation
    ? expectedFollowOnCost(ordered.value, allocation.entryStageId)
    : ok("0", CALCULATION_PROFILES.construction_expected_cf_v1.id);
  if (followOn.status !== "ok") return followOn;
  const costPerCompany = dec(allocation.initialCheck).plus(dec(followOn.value));
  if (costPerCompany.lte(0)) {
    return unavailable("zero_denominator", "Expected cost per company must be positive.", "construction_expected_cf_v1");
  }
  const dealCount = dec(allocation.budget).div(costPerCompany);
  const initialDeployed = dealCount.times(dec(allocation.initialCheck));
  const expectedFollowOn = dealCount.times(dec(followOn.value));

  let expectedExitProceeds = dec(0);
  let pEnter = dec(1);
  for (let i = entryIndex; i < ordered.value.length; i += 1) {
    const stage = ordered.value[i];
    const pExit = pEnter.times(dec(stage.exit));
    const ownership = ownershipAfterDilution(ordered.value, entryIndex, i, allocation.initialOwnership);
    expectedExitProceeds = expectedExitProceeds.plus(
      dealCount.times(pExit).times(ownership).times(dec(stage.exitValue)),
    );
    pEnter = pEnter.times(dec(stage.graduation));
  }

  const horizon = Math.max(1, allocation.horizonMonths);
  const perMonth = initialDeployed.div(horizon);
  const inception = parseISO(plan.inceptionDate);
  const monthlyInitialPacing = Array.from({ length: horizon }, (_, index) => ({
    month: format(addMonths(inception, index), "yyyy-MM"),
    amount: perMonth.toFixed(),
  }));

  return ok(
    {
      allocationId: allocation.id,
      expectedCostPerCompany: costPerCompany.toFixed(),
      projectedDealCount: dealCount.toFixed(),
      initialDeployed: initialDeployed.toFixed(),
      expectedFollowOn: expectedFollowOn.toFixed(),
      expectedExitProceeds: expectedExitProceeds.toFixed(),
      monthlyInitialPacing,
    },
    CALCULATION_PROFILES.construction_expected_cf_v1.id,
  );
}

export function buildConstructionForecast(plan: ConstructionPlan): CalcResult<ConstructionForecast> {
  const allocations: AllocationProjection[] = [];
  for (const allocation of plan.allocations) {
    const projected = projectAllocation(plan, allocation);
    if (projected.status !== "ok") return projected;
    allocations.push(projected.value);
  }
  const projectedDealCount = allocations.reduce((acc, row) => acc.plus(dec(row.projectedDealCount)), dec(0));
  const totalExpectedInvested = allocations.reduce(
    (acc, row) => acc.plus(dec(row.initialDeployed)).plus(dec(row.expectedFollowOn)),
    dec(0),
  );
  const totalExpectedExits = allocations.reduce((acc, row) => acc.plus(dec(row.expectedExitProceeds)), dec(0));
  return ok(
    {
      profile: CALCULATION_PROFILES.construction_expected_cf_v1.id,
      currency: plan.currency,
      projectedDealCount: projectedDealCount.toFixed(),
      totalExpectedInvested: totalExpectedInvested.toFixed(),
      totalExpectedExits: totalExpectedExits.toFixed(),
      allocations,
    },
    CALCULATION_PROFILES.construction_expected_cf_v1.id,
  );
}

export type ActualInvestmentCash = {
  invested: string;
  realized: string;
  unrealized: string;
};

export type CurrentForecastInput = {
  construction: ConstructionForecast;
  actuals: ActualInvestmentCash;
  remainingBudgetOverride?: string | null;
};

export type CurrentForecast = {
  profile: string;
  actualInvested: string;
  modeledRemaining: string;
  totalInvestedProjected: string;
  actualRealized: string;
  actualUnrealized: string;
  projectedDealCountUnchangedFromConstruction: string;
};

export function buildCurrentForecast(input: CurrentForecastInput): CalcResult<CurrentForecast> {
  const constructionInvested = dec(input.construction.totalExpectedInvested);
  const actualInvested = dec(input.actuals.invested);
  const remaining = input.remainingBudgetOverride
    ? dec(input.remainingBudgetOverride)
    : DecimalMax0(constructionInvested.minus(actualInvested));
  return ok(
    {
      profile: CALCULATION_PROFILES.current_forecast_v1.id,
      actualInvested: actualInvested.toFixed(),
      modeledRemaining: remaining.toFixed(),
      totalInvestedProjected: actualInvested.plus(remaining).toFixed(),
      actualRealized: dec(input.actuals.realized).toFixed(),
      actualUnrealized: dec(input.actuals.unrealized).toFixed(),
      projectedDealCountUnchangedFromConstruction: input.construction.projectedDealCount,
    },
    CALCULATION_PROFILES.current_forecast_v1.id,
  );
}

function DecimalMax0(value: ReturnType<typeof dec>) {
  return value.lt(0) ? dec(0) : value;
}

export function remainingBudgetAfterActuals(constructionBudget: string, actualInvested: string): string {
  const remaining = dec(constructionBudget).minus(dec(actualInvested));
  return remaining.lt(0) ? "0" : remaining.toFixed();
}

export type ScenarioOverrides = {
  followOnBoost?: string;
  remainingMultiplier?: string;
  exitHaircut?: string;
  exitDelayMonths?: number;
  note?: string;
  caseSelections?: Record<string, string>;
};

/** Overlay selected assumptions onto a Current Forecast snapshot. Does not rewrite construction deal counts. */
export function applyScenarioOverlay(baseline: CurrentForecast, overrides: ScenarioOverrides): CurrentForecast {
  const explicitMultiplier =
    overrides.remainingMultiplier != null &&
    overrides.remainingMultiplier !== "" &&
    overrides.remainingMultiplier !== "1";
  const remainingMult = explicitMultiplier
    ? dec(overrides.remainingMultiplier as string)
    : overrides.followOnBoost
      ? dec(1).plus(dec(overrides.followOnBoost))
      : dec(1);
  const remaining = DecimalMax0(dec(baseline.modeledRemaining).mul(remainingMult));
  const haircut = overrides.exitHaircut ? dec(overrides.exitHaircut) : dec(0);
  const unrealized = DecimalMax0(dec(baseline.actualUnrealized).mul(dec(1).minus(haircut)));
  return {
    ...baseline,
    modeledRemaining: remaining.toFixed(),
    totalInvestedProjected: dec(baseline.actualInvested).plus(remaining).toFixed(),
    actualUnrealized: unrealized.toFixed(),
    projectedDealCountUnchangedFromConstruction: baseline.projectedDealCountUnchangedFromConstruction,
  };
}

export { allocateByWeights };
