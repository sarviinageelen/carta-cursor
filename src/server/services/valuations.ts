import { and, eq } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { blendValuation, dcfValuation, fundOwnershipValue, postMoneyValuation, publicCompsValuation } from "@/domain/valuation";
import { getDb, schema } from "@/server/db";
import { nowIso, today } from "@/server/clock";
import { postJournal } from "@/server/services/accounting";
import { investmentMetrics } from "@/server/services/investments";

export function computeValuationValue(methodsJson: string) {
  const methods = JSON.parse(methodsJson) as Array<{
    method: string;
    weight: string;
    postMoney?: string;
    metric?: string;
    comps?: Array<{ name: string; multiple: string; weight: string }>;
    netDebt?: string;
    cashFlows?: string[];
    discountRate?: string;
    terminalGrowth?: string;
  }>;
  const values: Array<{ method: string; value: string; weight: string }> = [];
  for (const method of methods) {
    if (method.method === "post_money" && method.postMoney) {
      const result = postMoneyValuation(method.postMoney);
      if (result.status === "ok") values.push({ method: method.method, value: result.value, weight: method.weight });
    } else if (method.method === "public_comps" && method.metric && method.comps) {
      const result = publicCompsValuation(method.metric, method.comps, method.netDebt ?? "0");
      if (result.status === "ok") values.push({ method: method.method, value: result.value, weight: method.weight });
    } else if (method.method === "dcf" && method.cashFlows) {
      const result = dcfValuation({
        cashFlows: method.cashFlows,
        discountRate: method.discountRate ?? "0.12",
        terminalGrowth: method.terminalGrowth ?? "0.03",
      });
      if (result.status === "ok") values.push({ method: method.method, value: result.value, weight: method.weight });
    } else if (method.method === "opm" || method.method === "backsolve") {
      values.push({ method: method.method, value: "0", weight: method.weight });
    }
  }
  return blendValuation(values);
}

export function saveDraftValuation(input: {
  id?: string;
  companyId: string;
  fundId: string;
  asOfDate: string;
  methodsJson: string;
}) {
  const computed = computeValuationValue(input.methodsJson);
  const db = getDb();
  const investment = db
    .select()
    .from(schema.investments)
    .where(and(eq(schema.investments.fundId, input.fundId), eq(schema.investments.companyId, input.companyId)))
    .get();
  const ownership = investment ? investmentMetrics(investment.id, input.asOfDate, false).ownership : "0";
  const equity = computed.status === "ok" ? computed.value : null;
  const nav = equity ? fundOwnershipValue(equity, ownership) : null;
  if (input.id) {
    const existing = db.select().from(schema.valuations).where(eq(schema.valuations.id, input.id)).get();
    if (!existing) throw new Error("Valuation not found");
    if (existing.status === "posted") throw new Error("Posted valuations cannot be edited");
    db.update(schema.valuations)
      .set({
        methodsJson: input.methodsJson,
        equityValue: equity,
        fundNavImpact: nav,
        version: existing.version + 1,
      })
      .where(eq(schema.valuations.id, input.id))
      .run();
    return input.id;
  }
  const id = createId("val");
  db.insert(schema.valuations)
    .values({
      id,
      companyId: input.companyId,
      fundId: input.fundId,
      asOfDate: input.asOfDate,
      status: "draft",
      methodsJson: input.methodsJson,
      equityValue: equity,
      fundNavImpact: nav,
      postedJournalId: null,
      postedAt: null,
      version: 1,
      createdAt: nowIso(),
    })
    .run();
  return id;
}

export function postValuation(valuationId: string) {
  const db = getDb();
  const valuation = db.select().from(schema.valuations).where(eq(schema.valuations.id, valuationId)).get();
  if (!valuation) throw new Error("Valuation not found");
  if (valuation.status === "posted") return valuation;
  if (!valuation.fundId || !valuation.fundNavImpact) throw new Error("Valuation missing fund impact");
  const fund = db.select().from(schema.legalEntities).where(eq(schema.legalEntities.id, valuation.fundId)).get();
  const journal = postJournal({
    entityId: valuation.fundId,
    date: today(),
    effectiveDate: valuation.asOfDate,
    memo: `Posted valuation ${valuation.id}`,
    sourceType: "valuation_posting",
    sourceId: valuation.id,
    currency: fund?.currency ?? "USD",
    lines: [
      { accountCode: "1400", accountName: "Investments at FV", debit: valuation.fundNavImpact },
      { accountCode: "4100", accountName: "Unrealized gain", credit: valuation.fundNavImpact },
    ],
  });
  db.update(schema.valuations)
    .set({
      status: "posted",
      postedJournalId: journal?.id ?? null,
      postedAt: nowIso(),
    })
    .where(eq(schema.valuations.id, valuationId))
    .run();
  return db.select().from(schema.valuations).where(eq(schema.valuations.id, valuationId)).get();
}
