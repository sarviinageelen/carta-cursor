import { eq } from "drizzle-orm";
import { dec } from "@/domain/money";
import { irrAct365F, type DatedCashFlow } from "@/domain/irr";
import { grossMoic } from "@/domain/metrics";
import { getDb, schema } from "@/server/db";

export function investmentCashAsOf(fundId: string, asOf: string, includeProjected: boolean) {
  const db = getDb();
  const investments = db.select().from(schema.investments).where(eq(schema.investments.fundId, fundId)).all();
  let invested = dec(0);
  let realized = dec(0);
  let unrealized = dec(0);
  for (const investment of investments) {
    const metrics = investmentMetrics(investment.id, asOf, includeProjected);
    invested = invested.plus(dec(metrics.invested));
    realized = realized.plus(dec(metrics.realized));
    unrealized = unrealized.plus(dec(metrics.unrealized));
  }
  return {
    invested: invested.toFixed(),
    realized: realized.toFixed(),
    unrealized: unrealized.toFixed(),
  };
}

export function investmentMetrics(investmentId: string, asOf: string, includeProjected: boolean) {
  const db = getDb();
  const cases = db
    .select()
    .from(schema.investmentCases)
    .where(eq(schema.investmentCases.investmentId, investmentId))
    .all();
  const base = cases.find((row) => row.isBase) ?? cases[0];
  if (!base) {
    return { invested: "0", realized: "0", unrealized: "0", ownership: "0", moic: null, irr: null, events: [] as typeof schema.investmentEvents.$inferSelect[] };
  }
  const events = db
    .select()
    .from(schema.investmentEvents)
    .where(eq(schema.investmentEvents.caseId, base.id))
    .all()
    .filter((event) => event.date <= asOf && (includeProjected || !event.isProjected));
  let invested = dec(0);
  let realized = dec(0);
  let ownership = dec(0);
  let lastEquity: string | null = null;
  const flows: DatedCashFlow[] = [];
  for (const event of events.sort((a, b) => a.date.localeCompare(b.date))) {
    if (event.kind === "financing" || event.kind === "secondary_purchase") {
      invested = invested.plus(dec(event.amount));
      flows.push({ date: event.date, amount: dec(event.amount).negated().toFixed() });
    }
    if (event.kind === "partial_sale" || event.kind === "exit" || event.kind === "investment_income") {
      realized = realized.plus(dec(event.amount));
      flows.push({ date: event.date, amount: event.amount });
    }
    if (event.ownership) ownership = dec(event.ownership);
    if (event.postMoney) lastEquity = event.postMoney;
    if (event.kind === "valuation_update" && event.amount) lastEquity = event.amount;
  }
  const posted = db
    .select()
    .from(schema.valuations)
    .where(eq(schema.valuations.status, "posted"))
    .all()
    .filter((row) => row.asOfDate <= asOf);
  const investment = db.select().from(schema.investments).where(eq(schema.investments.id, investmentId)).get();
  const matching = posted
    .filter((row) => row.companyId === investment?.companyId && (!row.fundId || row.fundId === investment.fundId))
    .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate))[0];
  let unrealized = dec(0);
  if (matching?.fundNavImpact) {
    unrealized = dec(matching.fundNavImpact);
  } else if (lastEquity) {
    unrealized = dec(lastEquity).times(ownership);
  }
  const moic = grossMoic(invested.toFixed(), realized.toFixed(), unrealized.toFixed());
  const irr = flows.length ? irrAct365F(flows) : null;
  return {
    invested: invested.toFixed(),
    realized: realized.toFixed(),
    unrealized: unrealized.toFixed(),
    ownership: ownership.toFixed(),
    moic,
    irr,
    events,
    caseId: base.id,
  };
}
