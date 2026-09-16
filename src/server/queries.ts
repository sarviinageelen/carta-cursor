import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "./db/client";
import {
  companies,
  funds,
  firms,
  investmentEvents,
  investments,
  type Company,
  type Fund,
  type InvestmentEvent,
} from "./db/schema";
import {
  deriveFundSummary,
  derivePosition,
  type FundSummary,
  type PositionStatus,
} from "@/domain/portfolio";

export function getFirm() {
  return db.select().from(firms).limit(1).get();
}

export function listFunds(): Fund[] {
  return db.select().from(funds).orderBy(asc(funds.vintageYear)).all();
}

export function getFund(fundId: string): Fund | undefined {
  return db.select().from(funds).where(eq(funds.id, fundId)).get();
}

export interface InvestmentRow {
  id: string;
  company: Company;
  entryStage: string;
  status: PositionStatus;
  entryDate: string;
  currency: string;
  events: InvestmentEvent[];
}

function loadInvestmentRows(fundId?: string): InvestmentRow[] {
  const invRows = fundId
    ? db.select().from(investments).where(eq(investments.fundId, fundId)).all()
    : db.select().from(investments).all();

  if (invRows.length === 0) return [];

  const companyIds = [...new Set(invRows.map((i) => i.companyId))];
  const companyRows = db
    .select()
    .from(companies)
    .where(inArray(companies.id, companyIds))
    .all();
  const companyById = new Map(companyRows.map((c) => [c.id, c]));

  const invIds = invRows.map((i) => i.id);
  const eventRows = db
    .select()
    .from(investmentEvents)
    .where(inArray(investmentEvents.investmentId, invIds))
    .all();
  const eventsByInvestment = new Map<string, InvestmentEvent[]>();
  for (const e of eventRows) {
    const list = eventsByInvestment.get(e.investmentId) ?? [];
    list.push(e);
    eventsByInvestment.set(e.investmentId, list);
  }

  return invRows.map((i) => ({
    id: i.id,
    company: companyById.get(i.companyId)!,
    entryStage: i.entryStage,
    status: i.status as PositionStatus,
    entryDate: i.entryDate,
    currency: i.currency,
    events: (eventsByInvestment.get(i.id) ?? []).sort((a, b) =>
      a.eventDate.localeCompare(b.eventDate),
    ),
  }));
}

export function listInvestmentsForFund(fundId: string): InvestmentRow[] {
  return loadInvestmentRows(fundId).sort((a, b) =>
    a.company.name.localeCompare(b.company.name),
  );
}

export function getInvestment(investmentId: string): InvestmentRow | undefined {
  const inv = db
    .select()
    .from(investments)
    .where(eq(investments.id, investmentId))
    .get();
  if (!inv) return undefined;
  const company = db
    .select()
    .from(companies)
    .where(eq(companies.id, inv.companyId))
    .get();
  const events = db
    .select()
    .from(investmentEvents)
    .where(eq(investmentEvents.investmentId, investmentId))
    .all()
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  return {
    id: inv.id,
    company: company!,
    entryStage: inv.entryStage,
    status: inv.status as PositionStatus,
    entryDate: inv.entryDate,
    currency: inv.currency,
    events,
  };
}

export function computeFundSummary(fundId: string): FundSummary {
  const rows = listInvestmentsForFund(fundId);
  return deriveFundSummary(
    rows.map((r) => ({ status: r.status, events: r.events })),
  );
}

export interface FundWithSummary {
  fund: Fund;
  summary: FundSummary;
}

export function listFundsWithSummaries(): FundWithSummary[] {
  return listFunds().map((fund) => ({
    fund,
    summary: computeFundSummary(fund.id),
  }));
}

export function positionForRow(row: InvestmentRow) {
  return derivePosition(row.status, row.events);
}
