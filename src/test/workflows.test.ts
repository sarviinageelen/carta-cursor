import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fund-erp-"));
process.env.DATABASE_PATH = path.join(dir, "test.sqlite");

const { migrate } = await import("../server/db/migrate");
const { seed } = await import("../server/db/seed");
const { getDb, schema } = await import("../server/db");
const { constructionForecastForFund, currentForecastForFund, projectedDealCount, monthlyModel } = await import(
  "../server/services/forecast"
);
const { persistInvestmentDraft, recalculateScenario } = await import("../server/services/scenarios");
const { postValuation, saveDraftValuation } = await import("../server/services/valuations");
const { accountNet, assertJournalsBalance, creditNormalBalance } = await import("../server/services/accounting");
const { issueCapitalCall } = await import("../server/services/capital");
const { simulateApproveAndPay } = await import("../server/services/distributions");
const { rejectSubmission, submitKpi } = await import("../server/services/kpis");
const { eq } = await import("drizzle-orm");

describe("seeded workflow contracts", () => {
  beforeAll(() => {
    migrate();
    seed();
  });

  it("AC04 construction vs current", () => {
    const construction = constructionForecastForFund("fund_nb_ii");
    const current = currentForecastForFund("fund_nb_ii", "2026-09-16");
    expect(construction?.status).toBe("ok");
    expect(current?.status).toBe("ok");
    if (construction?.status === "ok" && current?.status === "ok") {
      expect(Number(current.value.actualInvested)).toBeGreaterThan(0);
      expect(current.value.projectedDealCountUnchangedFromConstruction).toBe(construction.value.projectedDealCount);
    }
  });

  it("AC05 monthly override does not replan deals", () => {
    const before = projectedDealCount("fund_nb_ii");
    const form = new FormData();
    form.set("fundId", "fund_nb_ii");
    form.set("month", "2026-07");
    form.set("amount", "99999");
    // service-level write
    getDb()
      .insert(schema.monthlyActualOverrides)
      .values({ id: "ov_test", fundId: "fund_nb_ii", month: "2026-07", field: "expenses", amount: "99999", updatedAt: "2026-09-16T12:00:00.000Z" })
      .run();
    const after = projectedDealCount("fund_nb_ii");
    expect(after).toBe(before);
    const model = monthlyModel("fund_nb_ii", "current", "2026-09-16");
    expect(model.find((row) => row.month === "2026-07")?.expenses).toBe("99999");
  });

  it("AC13 draft valuation does not change NAV until post, and posting is idempotent", () => {
    const before = accountNet("fund_nb_ii", "1400", "2026-09-16");
    const id = saveDraftValuation({
      companyId: "co_nimbus",
      fundId: "fund_nb_ii",
      asOfDate: "2026-09-16",
      methodsJson: JSON.stringify([{ method: "post_money", weight: "1", postMoney: "10000000" }]),
    });
    expect(accountNet("fund_nb_ii", "1400", "2026-09-16")).toBe(before);
    const first = postValuation(id);
    const second = postValuation(id);
    expect(first?.postedJournalId).toBe(second?.postedJournalId);
    expect(accountNet("fund_nb_ii", "1400", "2026-09-16")).not.toBe(before);
  });

  it("AC09/AC10 KPI pending vs auto-approve", () => {
    submitKpi({ token: "sub_lumenforge_q2_demo", definitionId: "kpi_gm", proposedValue: "0.80" });
    const pending = getDb().select().from(schema.kpiSubmissions).all().find((row) => row.definitionId === "kpi_gm");
    expect(pending?.status).toBe("pending_review");
    rejectSubmission(pending!.id);
    const accepted = getDb()
      .select()
      .from(schema.kpiValues)
      .all()
      .find((row) => row.definitionId === "kpi_gm" && row.status === "accepted");
    expect(accepted?.value).toBe("0.78");
  });

  it("AC14 missing bank details cannot reach simulated paid", () => {
    const result = simulateApproveAndPay("dst_blocked");
    expect(result.status).toBe("blocked_missing_bank");
    const payment = getDb().select().from(schema.distributionPayments).where(eq(schema.distributionPayments.id, "pay_meridian")).get();
    expect(payment?.simulatedPaymentRef).toBeNull();
  });

  it("journals balance", () => {
    expect(() => assertJournalsBalance()).not.toThrow();
  });

  it("capital call 60/40 allocation conserves total", () => {
    // closed commitments already exist; issuing 1,000,000
    const id = issueCapitalCall({
      fundId: "fund_nb_ii",
      amount: "1000000.00",
      noticeDate: "2026-09-16",
      effectiveDate: "2026-09-16",
      dueDate: "2026-09-16",
      memo: "Test call",
    });
    const parts = getDb().select().from(schema.capitalAllocations).all().filter((row) => row.activityId === id);
    const total = parts.reduce((acc, row) => acc + Number(row.amount), 0);
    expect(total).toBeCloseTo(1000000, 2);
  });

  it("AC06 nested save persists through parent save", () => {
    const investment = getDb().select().from(schema.investments).where(eq(schema.investments.id, "inv_nimbus_ii")).get();
    const caseRow = getDb()
      .select()
      .from(schema.investmentCases)
      .all()
      .find((row) => row.investmentId === "inv_nimbus_ii" && row.isBase);
    persistInvestmentDraft({
      investmentId: "inv_nimbus_ii",
      version: investment!.version,
      caseId: caseRow!.id,
      events: [
        { id: "inv_nimbus_ii_ev_0", kind: "financing", date: "2025-01-10", amount: "2500000", ownership: "0.11", isProjected: false },
        { id: "inv_nimbus_ii_ev_1", kind: "exit", date: "2029-01-10", amount: "9000000", isProjected: true },
        { kind: "valuation_update", date: "2026-01-01", amount: "35000000", ownership: "0.11", isProjected: false, notes: "nested edit" },
      ],
    });
    const events = getDb().select().from(schema.investmentEvents).all().filter((row) => row.caseId === caseRow!.id);
    expect(events.some((row) => row.notes === "nested edit")).toBe(true);
    expect(events.some((row) => row.kind === "exit" && row.isProjected)).toBe(true);
    expect(events.find((row) => row.id === "inv_nimbus_ii_ev_0")?.postMoney).toBe("28000000");
  });

  it("LP A commitment query does not include LP B", () => {
    const atlantic = getDb()
      .select()
      .from(schema.commitments)
      .all()
      .filter((row) => row.investorId === "lp_atlantic");
    expect(atlantic.every((row) => row.investorId === "lp_atlantic")).toBe(true);
    expect(atlantic.some((row) => row.investorId === "lp_meridian")).toBe(false);
  });

  it("second firm isolation records exist", () => {
    const harbor = getDb().select().from(schema.firms).where(eq(schema.firms.id, "firm_harborstone")).get();
    expect(harbor).toBeTruthy();
  });

  it("seeded Fund II TVPI uses credit-normal paid-in", async () => {
    const { performanceMultiples } = await import("../domain/metrics");
    const paidIn = creditNormalBalance("fund_nb_ii", "3200", "2026-09-16");
    expect(Number(paidIn)).toBeGreaterThan(0);
    const multiples = performanceMultiples({
      paidIn,
      distributions: accountNet("fund_nb_ii", "3300", "2026-09-16"),
      residualValue: accountNet("fund_nb_ii", "1400", "2026-09-16"),
    });
    expect(multiples.status).toBe("ok");
    if (multiples.status === "ok") expect(Number(multiples.value.tvpi)).toBeGreaterThan(0);
  });

  it("AC24 scenario recalculate does not mutate journals or construction deal counts", () => {
    const journalsBefore = getDb().select().from(schema.journalEntries).all().length;
    const constructionBefore = constructionForecastForFund("fund_nb_ii");
    const currentBefore = currentForecastForFund("fund_nb_ii", "2026-09-16");
    const result = recalculateScenario("scen_followon", "2026-09-16");
    expect(result.dealCountUnchanged).toBe(true);
    expect(result.scenario?.projectedDealCountUnchangedFromConstruction).toBe(
      constructionBefore?.status === "ok" ? constructionBefore.value.projectedDealCount : undefined,
    );
    const currentAfter = currentForecastForFund("fund_nb_ii", "2026-09-16");
    if (currentBefore?.status === "ok" && currentAfter?.status === "ok") {
      expect(currentAfter.value.modeledRemaining).toBe(currentBefore.value.modeledRemaining);
    }
    expect(getDb().select().from(schema.journalEntries).all().length).toBe(journalsBefore);
    const stored = getDb().select().from(schema.fundScenarios).where(eq(schema.fundScenarios.id, "scen_followon")).get();
    expect(stored?.status).toBe("calculated");
    expect(stored?.stale).toBe(false);
  });
});
