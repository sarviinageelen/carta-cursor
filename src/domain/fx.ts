import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";

export function convertAmount(
  amount: string,
  fromCurrency: string,
  toCurrency: string,
  rate: string | null,
  rateDate: string | null,
): CalcResult<{ amount: string; fromCurrency: string; toCurrency: string; rate: string; rateDate: string }> {
  if (fromCurrency === toCurrency) {
    return ok(
      { amount: dec(amount).toFixed(), fromCurrency, toCurrency, rate: "1", rateDate: rateDate ?? "" },
      "fx_identity_v1",
    );
  }
  if (rate == null || rateDate == null) {
    return unavailable("missing_fx", `No FX rate from ${fromCurrency} to ${toCurrency}.`, "fx_explicit_v1");
  }
  return ok(
    {
      amount: dec(amount).times(dec(rate)).toFixed(),
      fromCurrency,
      toCurrency,
      rate,
      rateDate,
    },
    "fx_explicit_v1",
  );
}

export function rejectCrossCurrencyTotal(currencies: string[]): CalcResult<true> {
  const unique = [...new Set(currencies)];
  if (unique.length > 1) {
    return unavailable(
      "currency_mismatch",
      "Cannot pool amounts across currencies without an explicit reporting currency and FX method.",
      "fx_explicit_v1",
    );
  }
  return ok(true, "fx_explicit_v1");
}
