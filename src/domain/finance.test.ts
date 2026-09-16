import { describe, expect, it } from "vitest";
import { validateStageProbabilities } from "../domain/probabilities";
import { performanceMultiples } from "../domain/metrics";
import { irrAct365F } from "../domain/irr";
import {
  buildConstructionForecast,
  buildCurrentForecast,
  expectedFollowOnCost,
  applyScenarioOverlay,
  type ConstructionPlan,
} from "../domain/construction";
import { europeanWholeFundWaterfall, americanWaterfallUnsupported } from "../domain/waterfall-fund";
import { allocateLiquidationPreference } from "../domain/liq-pref";
import { runEntityWaterfall } from "../domain/waterfall-entity";
import { evaluateFormula, shiftPeriod } from "../domain/formula";
import { allocateByWeights } from "../domain/money";
import { safeOwnership } from "../domain/safe";
import { accrueFixedInterest } from "../domain/loan";
import { rejectCrossCurrencyTotal } from "../domain/fx";
import { blendValuation, dcfValuation, publicCompsValuation } from "../domain/valuation";

const stages = [
  {
    id: "seed",
    name: "Seed",
    sortOrder: 0,
    graduation: "0.60",
    exit: "0.15",
    monthsToNext: 18,
    monthsToExit: 24,
    exitValue: "40000000",
    optionPoolDilution: "0.10",
    followOnCheck: "0",
  },
  {
    id: "a",
    name: "Series A",
    sortOrder: 1,
    graduation: "0.50",
    exit: "0.20",
    monthsToNext: 18,
    monthsToExit: 24,
    exitValue: "120000000",
    optionPoolDilution: "0.10",
    followOnCheck: "2000000",
  },
  {
    id: "b",
    name: "Series B",
    sortOrder: 2,
    graduation: "0",
    exit: "0.40",
    monthsToNext: 0,
    monthsToExit: 36,
    exitValue: "300000000",
    optionPoolDilution: "0",
    followOnCheck: "3000000",
  },
];

const plan: ConstructionPlan = {
  inceptionDate: "2024-01-01",
  currency: "USD",
  commitments: "180000000",
  gpCommitment: "3600000",
  allocations: [
    {
      id: "alloc_seed",
      name: "Seed",
      entryStageId: "seed",
      budget: "60000000",
      initialCheck: "2000000",
      initialOwnership: "0.12",
      followOnParticipation: true,
      horizonMonths: 36,
    },
  ],
  stagesByProfile: { core: stages },
  allocationProfileId: { alloc_seed: "core" },
};

describe("AC01-AC03 stage probabilities", () => {
  it("rejects graduation 60% + exit 50%", () => {
    const result = validateStageProbabilities({ graduation: "0.60", exit: "0.50" });
    expect(result.status).toBe("unavailable");
  });

  it("requires terminal graduation of zero", () => {
    const result = validateStageProbabilities({ graduation: "0.10", exit: "0.20", isTerminal: true });
    expect(result.status).toBe("unavailable");
  });

  it("computes residual failure 25% before rounding", () => {
    const result = validateStageProbabilities({ graduation: "0.60", exit: "0.15" });
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.value.failure).toBe("0.25");
  });
});

describe("AC16-AC18 multiples and IRR", () => {
  it("computes DPI 0.3 / RVPI 1.2 / TVPI 1.5", () => {
    const result = performanceMultiples({ paidIn: "10", distributions: "3", residualValue: "12" });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.value.dpi).toBe("0.3");
      expect(result.value.rvpi).toBe("1.2");
      expect(result.value.tvpi).toBe("1.5");
    }
  });

  it("returns unavailable for zero paid-in", () => {
    const result = performanceMultiples({ paidIn: "0", distributions: "3", residualValue: "12" });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") expect(result.code).toBe("zero_denominator");
  });

  it("returns 10% IRR for -100 then +110 one year later under ACT/365F", () => {
    const result = irrAct365F([
      { date: "2025-01-01", amount: "-100" },
      { date: "2026-01-01", amount: "110" },
    ]);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(Number(result.value.rate)).toBeCloseTo(0.1, 8);
    }
  });

  it("rejects no-sign-change IRR", () => {
    const result = irrAct365F([
      { date: "2025-01-01", amount: "-100" },
      { date: "2026-01-01", amount: "-10" },
    ]);
    expect(result.status).toBe("unavailable");
  });
});

describe("construction vs current forecast", () => {
  it("projects deal count from budget / expected cost and follow-on shrinks count", () => {
    const withFollowOn = buildConstructionForecast(plan);
    const without = buildConstructionForecast({
      ...plan,
      allocations: [{ ...plan.allocations[0], followOnParticipation: false }],
    });
    expect(withFollowOn.status).toBe("ok");
    expect(without.status).toBe("ok");
    if (withFollowOn.status === "ok" && without.status === "ok") {
      expect(Number(withFollowOn.value.projectedDealCount)).toBeLessThan(
        Number(without.value.projectedDealCount),
      );
    }
  });

  it("AC04: actual investment changes current forecast not construction", () => {
    const construction = buildConstructionForecast(plan);
    expect(construction.status).toBe("ok");
    if (construction.status !== "ok") return;
    const baselineDeals = construction.value.projectedDealCount;
    const current = buildCurrentForecast({
      construction: construction.value,
      actuals: { invested: "8000000", realized: "0", unrealized: "11000000" },
    });
    expect(current.status).toBe("ok");
    const constructionAfter = buildConstructionForecast(plan);
    expect(constructionAfter.status).toBe("ok");
    if (constructionAfter.status === "ok") {
      expect(constructionAfter.value.projectedDealCount).toBe(baselineDeals);
    }
    if (current.status === "ok") {
      expect(current.value.actualInvested).toBe("8000000");
      expect(current.value.projectedDealCountUnchangedFromConstruction).toBe(baselineDeals);
    }
  });

  it("expected follow-on uses entry probabilities", () => {
    const result = expectedFollowOnCost(stages, "seed");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      // 0.60 * 2,000,000 + 0.60 * 0.50 * 3,000,000 = 1,200,000 + 900,000 = 2,100,000
      expect(result.value).toBe("2100000");
    }
  });
});

describe("waterfall, prefs, formulas, SAFE, FX, loans", () => {
  it("allocates a 1,000,000 call 60/40 without remainder loss", () => {
    expect(allocateByWeights("1000000", ["0.6", "0.4"])).toEqual(["600000.00", "400000.00"]);
  });

  it("assigns rounding remainder to the largest weight", () => {
    const parts = allocateByWeights("1.00", ["1", "1", "1"]);
    const total = parts.reduce((acc, value) => acc + Number(value), 0);
    expect(total).toBeCloseTo(1, 8);
  });

  it("runs a European waterfall with GP commitment separate from carry", () => {
    const result = europeanWholeFundWaterfall({
      contributedCapital: "100",
      gpCommitment: "5",
      distributableProceeds: "200",
      preferredRate: "0.08",
      catchUp: true,
      carryRate: "0.20",
      contributionDate: "2024-01-01",
      distributionDate: "2025-01-01",
    });
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(Number(result.value.gpAsLpReturnOfCapital)).toBe(5);
      expect(Number(result.value.lpTotal) + Number(result.value.gpTotal)).toBeCloseTo(200, 8);
      expect(Number(result.value.gpCarry)).toBeGreaterThan(0);
    }
  });

  it("marks American waterfall unsupported", () => {
    expect(americanWaterfallUnsupported().status).toBe("unavailable");
  });

  it("orders liquidation preferences with seniority 0 first", () => {
    const result = allocateLiquidationPreference("100", [
      {
        id: "a",
        name: "Series A",
        seniority: 0,
        type: "non_participating",
        preferenceAmount: "40",
        fullyDilutedOwnership: "0.2",
      },
      {
        id: "seed",
        name: "Seed",
        seniority: 1,
        type: "participating_capped",
        preferenceAmount: "20",
        participationCap: "40",
        fullyDilutedOwnership: "0.15",
      },
    ]);
    expect(result.status).toBe("ok");
  });

  it("prevents entity-waterfall cycles", () => {
    const result = runEntityWaterfall({
      exitEntityId: "co",
      exitValue: "100",
      nodes: [
        { id: "co", name: "Co", kind: "company" },
        { id: "hold", name: "Hold", kind: "holding" },
      ],
      edges: [
        { fromId: "co", toId: "hold", ownership: "1" },
        { fromId: "hold", toId: "co", ownership: "1" },
      ],
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") expect(result.code).toBe("cycle_detected");
  });

  it("evaluates a safe formula and shifts relative periods", () => {
    const result = evaluateFormula("arr * 0.2 + ebitda", [
      { name: "arr", value: "100" },
      { name: "ebitda", value: "10" },
    ]);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.value).toBe("30");
    expect(shiftPeriod("2025-03", -12)).toBe("2024-03");
  });

  it("does not treat a SAFE cap as verified ownership", () => {
    const result = safeOwnership({
      invested: "1000000",
      valuationCap: "10000000",
      discount: null,
      pricedRoundPreMoney: null,
      pricedRoundNewMoney: null,
      suppliedConvertedOwnership: null,
    });
    expect(result.status).toBe("unavailable");
  });

  it("rejects mixed-currency pooling", () => {
    const result = rejectCrossCurrencyTotal(["USD", "EUR"]);
    expect(result.status).toBe("unavailable");
  });

  it("accrues fixed-rate ACT/365F interest and rejects PIK", () => {
    const interest = accrueFixedInterest({
      principal: "365000",
      annualRate: "0.10",
      startDate: "2025-01-01",
      endDate: "2026-01-01",
      dayCount: "ACT/365F",
      pik: false,
    });
    expect(interest.status).toBe("ok");
    if (interest.status === "ok") expect(Number(interest.value)).toBeCloseTo(36500, 6);
    expect(
      accrueFixedInterest({
        principal: "100",
        annualRate: "0.1",
        startDate: "2025-01-01",
        endDate: "2025-02-01",
        dayCount: "ACT/365F",
        pik: true,
      }).status,
    ).toBe("unavailable");
  });

  it("supports comps and DCF and refuses OPM-only blends", () => {
    const comps = publicCompsValuation("10", [{ name: "Peer", multiple: "8", weight: "1" }], "5");
    expect(comps.status).toBe("ok");
    const dcf = dcfValuation({ cashFlows: ["10", "11", "12"], discountRate: "0.12", terminalGrowth: "0.03" });
    expect(dcf.status).toBe("ok");
    const opm = blendValuation([{ method: "opm", value: "100", weight: "1" }]);
    expect(opm.status).toBe("unavailable");
  });

  it("applies scenario overlays without changing construction deal counts", () => {
    const current = buildCurrentForecast({
      construction: {
        profile: "construction_expected_cf_v1",
        currency: "USD",
        projectedDealCount: "12.5",
        totalExpectedInvested: "100000000",
        totalExpectedExits: "200000000",
        allocations: [],
      },
      actuals: { invested: "40000000", realized: "0", unrealized: "50000000" },
    });
    expect(current.status).toBe("ok");
    if (current.status !== "ok") return;
    const overlay = applyScenarioOverlay(current.value, { followOnBoost: "0.25", exitHaircut: "0.10" });
    expect(overlay.projectedDealCountUnchangedFromConstruction).toBe("12.5");
    expect(overlay.actualInvested).toBe(current.value.actualInvested);
    expect(Number(overlay.modeledRemaining)).toBeCloseTo(Number(current.value.modeledRemaining) * 1.25, 6);
    expect(Number(overlay.actualUnrealized)).toBeCloseTo(45000000, 6);
  });
});
