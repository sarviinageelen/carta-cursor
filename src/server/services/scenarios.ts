import { eq } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { getDb, schema } from "@/server/db";
import { nowIso } from "@/server/clock";
import { applyScenarioOverlay } from "@/domain/construction";
import { currentForecastForFund } from "@/server/services/forecast";

export function saveScenario(input: {
  id?: string;
  fundId: string;
  name: string;
  overrides: Record<string, unknown>;
}) {
  const db = getDb();
  const inputVersion = 1;
  if (input.id) {
    db.update(schema.fundScenarios)
      .set({
        name: input.name,
        overridesJson: JSON.stringify(input.overrides),
        stale: true,
        updatedAt: nowIso(),
      })
      .where(eq(schema.fundScenarios.id, input.id))
      .run();
    return input.id;
  }
  const id = createId("scen");
  db.insert(schema.fundScenarios)
    .values({
      id,
      fundId: input.fundId,
      name: input.name,
      status: "draft",
      overridesJson: JSON.stringify(input.overrides),
      resultJson: null,
      inputVersion,
      calculatedInputVersion: null,
      stale: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  return id;
}

export function recalculateScenario(scenarioId: string, asOf: string) {
  const db = getDb();
  const scenario = db.select().from(schema.fundScenarios).where(eq(schema.fundScenarios.id, scenarioId)).get();
  if (!scenario) throw new Error("Scenario not found");
  const baseline = currentForecastForFund(scenario.fundId, asOf);
  const overrides = JSON.parse(scenario.overridesJson) as {
    followOnBoost?: string;
    remainingMultiplier?: string;
    exitHaircut?: string;
    exitDelayMonths?: number;
    note?: string;
  };
  if (!baseline || baseline.status !== "ok") {
    const result = {
      baseline,
      scenario: null,
      applied: overrides,
      dealCountUnchanged: true,
      note: "Baseline current forecast is unavailable; scenario was not applied to construction or journals.",
      calculatedAt: nowIso(),
    };
    db.update(schema.fundScenarios)
      .set({
        resultJson: JSON.stringify(result),
        calculatedInputVersion: scenario.inputVersion,
        stale: false,
        status: "calculated",
        updatedAt: nowIso(),
      })
      .where(eq(schema.fundScenarios.id, scenarioId))
      .run();
    return result;
  }
  const scenarioValue = applyScenarioOverlay(baseline.value, overrides);
  const result = {
    baseline: baseline.value,
    scenario: scenarioValue,
    applied: overrides,
    dealCountUnchanged: scenarioValue.projectedDealCountUnchangedFromConstruction === baseline.value.projectedDealCountUnchangedFromConstruction,
    note: "Scenario overlays selected assumptions without mutating construction, actuals, or posted journals.",
    calculatedAt: nowIso(),
  };
  db.update(schema.fundScenarios)
    .set({
      resultJson: JSON.stringify(result),
      calculatedInputVersion: scenario.inputVersion,
      stale: false,
      status: "calculated",
      updatedAt: nowIso(),
    })
    .where(eq(schema.fundScenarios.id, scenarioId))
    .run();
  return result;
}

export function persistInvestmentDraft(input: {
  investmentId: string;
  version: number;
  events: Array<{
    id?: string;
    kind: string;
    date: string;
    amount: string;
    ownership?: string | null;
    isProjected?: boolean;
    notes?: string | null;
    securityType?: string | null;
    postMoney?: string | null;
    preMoney?: string | null;
  }>;
  caseId: string;
}) {
  const db = getDb();
  const investment = db.select().from(schema.investments).where(eq(schema.investments.id, input.investmentId)).get();
  if (!investment) throw new Error("Investment not found");
  if (investment.version !== input.version) {
    throw new Error("Version conflict: reload before saving. Prototype uses optimistic locking (intentional deviation from last-save-wins).");
  }
  db.transaction((tx) => {
    const previous = tx.select().from(schema.investmentEvents).where(eq(schema.investmentEvents.caseId, input.caseId)).all();
    const previousById = new Map(previous.map((row) => [row.id, row]));
    tx.delete(schema.investmentEvents).where(eq(schema.investmentEvents.caseId, input.caseId)).run();
    for (const event of input.events) {
      const prior = event.id ? previousById.get(event.id) : undefined;
      tx.insert(schema.investmentEvents)
        .values({
          id: event.id ?? createId("ev"),
          caseId: input.caseId,
          kind: event.kind,
          date: event.date,
          amount: event.amount,
          ownership: event.ownership ?? prior?.ownership ?? null,
          preMoney: event.preMoney ?? prior?.preMoney ?? null,
          postMoney: event.postMoney ?? prior?.postMoney ?? null,
          roundCurrency: prior?.roundCurrency ?? investment.currency,
          fxRate: prior?.fxRate ?? "1",
          fxRateDate: prior?.fxRateDate ?? event.date,
          securityType: event.securityType ?? prior?.securityType ?? "preferred",
          valuationCap: prior?.valuationCap ?? null,
          convertedOwnership: event.ownership ?? prior?.convertedOwnership ?? null,
          isProjected: event.isProjected ?? prior?.isProjected ?? false,
          sourceProvenance: prior?.sourceProvenance ?? "manual",
          sourceRecordId: prior?.sourceRecordId ?? null,
          notes: event.notes ?? prior?.notes ?? null,
        })
        .run();
    }
    tx.update(schema.investments)
      .set({ version: investment.version + 1, updatedAt: nowIso() })
      .where(eq(schema.investments.id, input.investmentId))
      .run();
  });
}

export function cloneCase(caseId: string, name: string) {
  const db = getDb();
  const source = db.select().from(schema.investmentCases).where(eq(schema.investmentCases.id, caseId)).get();
  if (!source) throw new Error("Case not found");
  const existing = db
    .select()
    .from(schema.investmentCases)
    .where(eq(schema.investmentCases.investmentId, source.investmentId))
    .all();
  if (existing.length >= 10) throw new Error("Maximum of 10 cases per investment");
  const id = createId("case");
  db.insert(schema.investmentCases)
    .values({
      id,
      investmentId: source.investmentId,
      name,
      probability: "0",
      isBase: false,
      clonedFromId: source.id,
    })
    .run();
  const events = db.select().from(schema.investmentEvents).where(eq(schema.investmentEvents.caseId, source.id)).all();
  for (const event of events) {
    db.insert(schema.investmentEvents)
      .values({ ...event, id: createId("ev"), caseId: id })
      .run();
  }
  return id;
}

export function syncHistoricalEvents(fromCaseId: string, toCaseId: string, asOf: string) {
  const db = getDb();
  const historical = db
    .select()
    .from(schema.investmentEvents)
    .where(eq(schema.investmentEvents.caseId, fromCaseId))
    .all()
    .filter((event) => event.date <= asOf && !event.isProjected);
  const existing = db.select().from(schema.investmentEvents).where(eq(schema.investmentEvents.caseId, toCaseId)).all();
  for (const event of existing.filter((row) => row.date <= asOf && !row.isProjected)) {
    db.delete(schema.investmentEvents).where(eq(schema.investmentEvents.id, event.id)).run();
  }
  for (const event of historical) {
    db.insert(schema.investmentEvents)
      .values({ ...event, id: createId("ev"), caseId: toCaseId })
      .run();
  }
}
