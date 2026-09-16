import { dec, type Decimal } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type StageProbabilityInput = {
  graduation: string | number;
  exit: string | number;
  isTerminal?: boolean;
};

export type StageProbability = {
  graduation: string;
  exit: string;
  failure: string;
};

export function validateStageProbabilities(
  input: StageProbabilityInput,
): CalcResult<StageProbability> {
  const profile = CALCULATION_PROFILES.stage_probability_v1.id;
  const graduation = dec(input.graduation);
  const exit = dec(input.exit);
  if (graduation.lt(0) || exit.lt(0)) {
    return unavailable("unsupported_configuration", "Probabilities cannot be negative.", profile);
  }
  if (graduation.gt(1) || exit.gt(1)) {
    return unavailable("unsupported_configuration", "Probabilities cannot exceed 100%.", profile);
  }
  if (input.isTerminal && !graduation.isZero()) {
    return unavailable(
      "unsupported_configuration",
      "Terminal stage graduation must be zero.",
      profile,
    );
  }
  const sum = graduation.plus(exit);
  if (sum.gt(1)) {
    return unavailable(
      "unsupported_configuration",
      "Graduation plus exit cannot exceed 100%. Failure would be negative.",
      profile,
    );
  }
  const failure = dec(1).minus(sum);
  return ok(
    {
      graduation: graduation.toFixed(),
      exit: exit.toFixed(),
      failure: failure.toFixed(),
    },
    profile,
  );
}

export function residualFailure(graduation: string | number, exit: string | number): Decimal {
  const result = validateStageProbabilities({ graduation, exit });
  if (result.status !== "ok") {
    throw new Error(result.message);
  }
  return dec(result.value.failure);
}
