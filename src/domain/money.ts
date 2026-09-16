import Decimal from "decimal.js";

// Prototype-wide decimal configuration. Rounding happens only at documented
// display boundaries; internal arithmetic keeps full precision.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

export type CurrencyCode = "USD" | "EUR" | "GBP";

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** Parse a canonical decimal string (as stored in SQLite) into a Decimal. */
export function money(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/** Serialize a Decimal to a canonical string for storage. */
export function toCanonical(value: Decimal): string {
  return value.toFixed();
}

export function sum(values: Array<string | number | Decimal>): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(money(v)), new Decimal(0));
}

/** Format a monetary amount with thousands separators and 0 decimals. */
export function formatCurrency(
  value: string | number | Decimal,
  currency: CurrencyCode = "USD",
): string {
  const d = money(value);
  const negative = d.isNegative();
  const abs = d.abs();
  const whole = abs.toFixed(0);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  return `${negative ? "-" : ""}${symbol}${grouped}`;
}

/** Format as a multiple, e.g. 1.53x. */
export function formatMultiple(value: string | number | Decimal): string {
  return `${money(value).toFixed(2)}x`;
}

/** Format a decimal rate (0.1 -> "10.0%"). */
export function formatPercent(
  value: string | number | Decimal,
  fractionDigits = 1,
): string {
  return `${money(value).times(100).toFixed(fractionDigits)}%`;
}
