// Typed results for financial calculations. Undefined/unsupported outcomes are
// represented explicitly instead of returning NaN, Infinity, or a fake zero.

export type Available<T> = { available: true; value: T };
export type Unavailable = { available: false; reason: string };
export type Result<T> = Available<T> | Unavailable;

export function ok<T>(value: T): Available<T> {
  return { available: true, value };
}

export function unavailable(reason: string): Unavailable {
  return { available: false, reason };
}
