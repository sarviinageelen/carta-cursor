import { eq } from "drizzle-orm";
import {
  buildConstructionForecast,
  buildCurrentForecast,
  type ConstructionPlan,
} from "@/domain/construction";
import { dec } from "@/domain/money";
import { getDb, schema } from "@/server/db";
import { investmentCashAsOf } from "@/server/services/investments";

export function loadConstructionPlan(fundId: string): ConstructionPlan | null {
  const db = getDb();
  const config = db
    .select()
    .from(schema.constructionConfigs)
    .where(eq(schema.constructionConfigs.fundId, fundId))
    .get();
  if (!config) return null;
  const profiles = db
    .select()
    .from(schema.sectorProfiles)
    .where(eq(schema.sectorProfiles.constructionId, config.id))
    .all();
  const stagesByProfile: ConstructionPlan["stagesByProfile"] = {};
  const allocationProfileId: Record<string, string> = {};
  for (const profile of profiles) {
    stagesByProfile[profile.id] = db
      .select()
      .from(schema.sectorStages)
      .where(eq(schema.sectorStages.profileId, profile.id))
      .all()
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        sortOrder: stage.sortOrder,
        graduation: stage.graduation,
        exit: stage.exit,
        monthsToNext: stage.monthsToNext,
        monthsToExit: stage.monthsToExit,
        exitValue: stage.exitValue,
        optionPoolDilution: stage.optionPoolDilution,
        followOnCheck: stage.followOnCheck,
      }));
  }
  const allocRows = db.select().from(schema.allocations).where(eq(schema.allocations.constructionId, config.id)).all();
  for (const alloc of allocRows) allocationProfileId[alloc.id] = alloc.profileId;
  return {
    inceptionDate: config.inceptionDate,
    currency: config.currency,
    commitments: config.commitments,
    gpCommitment: config.gpCommitment,
    allocations: allocRows.map((row) => ({
      id: row.id,
      name: row.name,
      entryStageId: row.entryStageId,
      budget: row.budget,
      initialCheck: row.initialCheck,
      initialOwnership: row.initialOwnership,
      followOnParticipation: row.followOnParticipation,
      horizonMonths: row.horizonMonths,
    })),
    stagesByProfile,
    allocationProfileId,
  };
}

export function constructionForecastForFund(fundId: string) {
  const plan = loadConstructionPlan(fundId);
  if (!plan) return null;
  return buildConstructionForecast(plan);
}

export function currentForecastForFund(fundId: string, asOf: string) {
  const construction = constructionForecastForFund(fundId);
  if (!construction || construction.status !== "ok") return construction;
  const actuals = investmentCashAsOf(fundId, asOf, false);
  return buildCurrentForecast({
    construction: construction.value,
    actuals,
  });
}

export function projectedDealCount(fundId: string) {
  const construction = constructionForecastForFund(fundId);
  if (!construction || construction.status !== "ok") return null;
  return construction.value.projectedDealCount;
}

export function monthlyModel(fundId: string, mode: "construction" | "current", asOf: string) {
  const plan = loadConstructionPlan(fundId);
  const construction = constructionForecastForFund(fundId);
  if (!plan || !construction || construction.status !== "ok") return [];
  const overrides = getDb()
    .select()
    .from(schema.monthlyActualOverrides)
    .where(eq(schema.monthlyActualOverrides.fundId, fundId))
    .all();
  const overrideMap = new Map(overrides.map((row) => [`${row.month}:${row.field}`, row.amount]));
  const months = new Map<string, { month: string; initial: string; followOn: string; fees: string; expenses: string; exits: string; kind: "actual" | "projected" }>();
  for (const alloc of construction.value.allocations) {
    for (const pace of alloc.monthlyInitialPacing) {
      const current = months.get(pace.month) ?? {
        month: pace.month,
        initial: "0",
        followOn: "0",
        fees: "0",
        expenses: "0",
        exits: "0",
        kind: pace.month <= asOf.slice(0, 7) ? "actual" : "projected",
      };
      current.initial = dec(current.initial).plus(dec(pace.amount)).toFixed();
      months.set(pace.month, current);
    }
  }
  const rows = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
  return rows.map((row) => {
    const expenses = overrideMap.get(`${row.month}:expenses`);
    const fees = overrideMap.get(`${row.month}:fees`);
    if (mode === "current") {
      return {
        ...row,
        expenses: expenses ?? row.expenses,
        fees: fees ?? row.fees,
        kind: row.month <= asOf.slice(0, 7) ? "actual" : "projected",
      };
    }
    return { ...row, kind: "projected" as const };
  });
}
