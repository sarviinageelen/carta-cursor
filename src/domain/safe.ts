import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";

export type SafeNoteInput = {
  invested: string;
  valuationCap: string | null;
  discount: string | null;
  pricedRoundPreMoney: string | null;
  pricedRoundNewMoney: string | null;
  suppliedConvertedOwnership: string | null;
};

export function safeOwnership(input: SafeNoteInput): CalcResult<{
  ownership: string;
  method: "supplied_conversion" | "simplified_cap_discount";
  capNotVerifiedOwnership: boolean;
}> {
  if (input.suppliedConvertedOwnership != null) {
    return ok(
      {
        ownership: dec(input.suppliedConvertedOwnership).toFixed(),
        method: "supplied_conversion",
        capNotVerifiedOwnership: false,
      },
      "safe_supplied_conversion_v1",
    );
  }
  if (input.pricedRoundPreMoney && input.pricedRoundNewMoney) {
    const post = dec(input.pricedRoundPreMoney).plus(dec(input.pricedRoundNewMoney));
    if (post.lte(0)) {
      return unavailable("zero_denominator", "Priced-round post-money must be positive.", "safe_simplified_v1");
    }
    let priceBase = post;
    if (input.valuationCap) {
      const cap = dec(input.valuationCap);
      if (cap.lt(priceBase)) priceBase = cap;
    }
    if (input.discount) {
      const discounted = dec(input.pricedRoundPreMoney).times(dec(1).minus(dec(input.discount)));
      if (discounted.gt(0) && discounted.lt(priceBase)) priceBase = discounted;
    }
    const ownership = dec(input.invested).div(priceBase);
    return ok(
      {
        ownership: ownership.toFixed(),
        method: "simplified_cap_discount",
        capNotVerifiedOwnership: true,
      },
      "safe_simplified_v1",
      ["Cap/discount conversion is a simplified prototype assumption, not a verified cap-table outcome."],
    );
  }
  return unavailable(
    "unsupported_configuration",
    "SAFE/note cap alone does not establish ownership. Supply a conversion outcome or a priced round.",
    "safe_cap_not_ownership_v1",
  );
}
