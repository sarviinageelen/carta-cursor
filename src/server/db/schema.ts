import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// All monetary amounts are stored as canonical decimal strings (never floats)
// and converted to Decimal in the domain layer. See src/domain/money.ts.

export const firms = sqliteTable("firms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  reportingCurrency: text("reporting_currency").notNull().default("USD"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const funds = sqliteTable(
  "funds",
  {
    id: text("id").primaryKey(),
    firmId: text("firm_id")
      .notNull()
      .references(() => firms.id),
    name: text("name").notNull(),
    vintageYear: integer("vintage_year").notNull(),
    currency: text("currency").notNull().default("USD"),
    // Committed capital across LPs (canonical decimal string).
    commitment: text("commitment").notNull(),
    strategy: text("strategy").notNull().default("Venture"),
    inceptionDate: text("inception_date").notNull(),
  },
  (t) => ({
    firmIdx: index("funds_firm_idx").on(t.firmId),
  }),
);

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  hqLocation: text("hq_location").notNull().default("—"),
});

export const investments = sqliteTable(
  "investments",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id")
      .notNull()
      .references(() => funds.id),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id),
    currency: text("currency").notNull().default("USD"),
    entryStage: text("entry_stage").notNull(),
    // "active" | "realized" | "written_off"
    status: text("status").notNull().default("active"),
    entryDate: text("entry_date").notNull(),
  },
  (t) => ({
    fundIdx: index("investments_fund_idx").on(t.fundId),
    companyIdx: index("investments_company_idx").on(t.companyId),
  }),
);

// Dated cash-flow / valuation events for an investment. This is the source of
// truth for all derived metrics (paid-in, distributions, residual value).
//   kind: "invest"       -> capital deployed into the company (cash out of fund)
//         "distribution" -> proceeds returned to the fund (cash into fund)
//         "valuation"     -> mark of the remaining unrealized position (no cash)
export const investmentEvents = sqliteTable(
  "investment_events",
  {
    id: text("id").primaryKey(),
    investmentId: text("investment_id")
      .notNull()
      .references(() => investments.id),
    kind: text("kind").notNull(),
    // Positive canonical decimal string. Sign/direction is implied by `kind`.
    amount: text("amount").notNull(),
    eventDate: text("event_date").notNull(),
    note: text("note").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => ({
    investmentIdx: index("investment_events_investment_idx").on(t.investmentId),
  }),
);

export type Firm = typeof firms.$inferSelect;
export type Fund = typeof funds.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type InvestmentEvent = typeof investmentEvents.$inferSelect;
export type InvestmentEventKind = "invest" | "distribution" | "valuation";
