import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type LiqPrefType = "non_participating" | "participating" | "participating_capped";

export type LiqPrefTranche = {
  id: string;
  name: string;
  seniority: number;
  type: LiqPrefType;
  preferenceAmount: string;
  participationCap?: string | null;
  fullyDilutedOwnership: string;
};

export type LiqPrefResult = {
  profile: string;
  allocations: Array<{ trancheId: string; name: string; amount: string }>;
  commonResidual: string;
};

export function allocateLiquidationPreference(
  exitProceeds: string,
  tranches: LiqPrefTranche[],
): CalcResult<LiqPrefResult> {
  const profile = CALCULATION_PROFILES.liq_pref_stack_v1.id;
  const proceeds = dec(exitProceeds);
  if (proceeds.lt(0)) {
    return unavailable("unsupported_configuration", "Exit proceeds cannot be negative.", profile);
  }
  const ordered = [...tranches].sort((a, b) => a.seniority - b.seniority);
  for (let i = 0; i < ordered.length; i += 1) {
    if (ordered[i].seniority !== i) {
      return unavailable(
        "unsupported_configuration",
        "Seniority must be a contiguous order starting at 0 (most senior).",
        profile,
      );
    }
  }
  let remaining = proceeds;
  const allocations: LiqPrefResult["allocations"] = [];
  let participatingShare = dec(0);
  const participating: LiqPrefTranche[] = [];

  for (const tranche of ordered) {
    const pref = dec(tranche.preferenceAmount);
    const paid = remaining.lt(pref) ? remaining : pref;
    remaining = remaining.minus(paid);
    allocations.push({ trancheId: tranche.id, name: `${tranche.name} preference`, amount: paid.toFixed() });
    if (tranche.type !== "non_participating") {
      participating.push(tranche);
      participatingShare = participatingShare.plus(dec(tranche.fullyDilutedOwnership));
    }
  }

  const commonOwnership = dec(1).minus(participatingShare);
  if (commonOwnership.lt(0)) {
    return unavailable("unsupported_configuration", "Participating ownership exceeds 100%.", profile);
  }

  let commonResidual = remaining.times(commonOwnership);
  if (participating.length > 0 && remaining.gt(0)) {
    for (const tranche of participating) {
      let share = remaining.times(dec(tranche.fullyDilutedOwnership));
      if (tranche.type === "participating_capped" && tranche.participationCap) {
        const already = dec(
          allocations.find((row) => row.trancheId === tranche.id)?.amount ?? "0",
        );
        const cap = dec(tranche.participationCap);
        const room = cap.minus(already);
        if (share.gt(room)) share = room.lt(0) ? dec(0) : room;
      }
      allocations.push({
        trancheId: tranche.id,
        name: `${tranche.name} participation`,
        amount: share.toFixed(),
      });
      remaining = remaining.minus(share);
    }
    commonResidual = remaining;
  }

  allocations.push({ trancheId: "common", name: "Common / residual", amount: commonResidual.toFixed() });
  return ok({ profile, allocations, commonResidual: commonResidual.toFixed() }, profile);
}
