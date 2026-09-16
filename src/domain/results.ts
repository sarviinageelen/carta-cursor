export type UnavailableCode =
  | "zero_denominator"
  | "missing_valuation"
  | "missing_fx"
  | "invalid_chronology"
  | "unsupported_configuration"
  | "no_solution"
  | "nonconverged"
  | "ambiguous_root"
  | "missing_data"
  | "currency_mismatch"
  | "cycle_detected";

export type CalcOk<T> = {
  status: "ok";
  value: T;
  profile: string;
  warnings: string[];
};

export type CalcUnavailable = {
  status: "unavailable";
  code: UnavailableCode;
  message: string;
  profile: string;
  warnings: string[];
};

export type CalcResult<T> = CalcOk<T> | CalcUnavailable;

export function ok<T>(value: T, profile: string, warnings: string[] = []): CalcOk<T> {
  return { status: "ok", value, profile, warnings };
}

export function unavailable(
  code: UnavailableCode,
  message: string,
  profile: string,
  warnings: string[] = [],
): CalcUnavailable {
  return { status: "unavailable", code, message, profile, warnings };
}

export function isOk<T>(result: CalcResult<T>): result is CalcOk<T> {
  return result.status === "ok";
}
