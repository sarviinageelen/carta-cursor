import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

export { Decimal };

export type Amount = string;

export function dec(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number cannot be used as money");
    }
  }
  return new Decimal(value);
}

export function amount(value: string | number | Decimal): Amount {
  return dec(value).toFixed();
}

export function roundCurrency(value: string | number | Decimal, places = 2): Amount {
  return dec(value).toDecimalPlaces(places, Decimal.ROUND_HALF_EVEN).toFixed(places);
}

export function sumAmounts(values: Array<string | number | Decimal>): Decimal {
  return values.reduce<Decimal>((acc, value) => acc.plus(dec(value)), new Decimal(0));
}

export function isZero(value: string | number | Decimal): boolean {
  return dec(value).isZero();
}

export function compareAmount(a: string | number | Decimal, b: string | number | Decimal): number {
  return dec(a).comparedTo(dec(b));
}

/** Assign remainders after rounding so allocated parts conserve the total. */
export function allocateByWeights(
  total: string | number | Decimal,
  weights: Array<string | number | Decimal>,
  places = 2,
): Amount[] {
  const totalDec = dec(total);
  const weightDecs = weights.map((weight) => dec(weight));
  const weightSum = sumAmounts(weightDecs);
  if (weightSum.isZero()) {
    throw new Error("Cannot allocate against zero weights");
  }
  const rounded = weightDecs.map((weight) =>
    totalDec.times(weight).div(weightSum).toDecimalPlaces(places, Decimal.ROUND_HALF_EVEN),
  );
  const allocated = sumAmounts(rounded);
  const remainder = totalDec.toDecimalPlaces(places, Decimal.ROUND_HALF_EVEN).minus(allocated);
  if (!remainder.isZero() && rounded.length > 0) {
    let maxIndex = 0;
    for (let i = 1; i < weightDecs.length; i += 1) {
      if (weightDecs[i].gt(weightDecs[maxIndex])) maxIndex = i;
    }
    rounded[maxIndex] = rounded[maxIndex].plus(remainder);
  }
  return rounded.map((value) => value.toFixed(places));
}
