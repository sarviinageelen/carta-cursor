import { db, sqlite } from "./client";
import {
  companies,
  firms,
  funds,
  investmentEvents,
  investments,
} from "./schema";

// Deterministic synthetic seed. Idempotent: if a firm already exists we leave
// the database untouched so local edits are never overwritten on reinstall.

interface SeedEvent {
  kind: "invest" | "distribution" | "valuation";
  amount: string;
  eventDate: string;
  note?: string;
}

interface SeedInvestment {
  id: string;
  company: string;
  entryStage: string;
  status: "active" | "realized" | "written_off";
  entryDate: string;
  events: SeedEvent[];
}

const COMPANIES: Array<{ id: string; name: string; sector: string; hq: string }> = [
  { id: "co_northwind", name: "Northwind Robotics", sector: "Robotics", hq: "Boston, MA" },
  { id: "co_cobalt", name: "Cobalt Health", sector: "Healthcare", hq: "Austin, TX" },
  { id: "co_pallas", name: "Pallas Analytics", sector: "Data", hq: "Seattle, WA" },
  { id: "co_vantage", name: "Vantage Mobility", sector: "Mobility", hq: "Detroit, MI" },
  { id: "co_lumen", name: "Lumen Security", sector: "Security", hq: "Reston, VA" },
  { id: "co_beacon", name: "Beacon Logistics", sector: "Logistics", hq: "Memphis, TN" },
  { id: "co_aurora", name: "Aurora Biosciences", sector: "Biotech", hq: "San Diego, CA" },
  { id: "co_continuum", name: "Continuum AI", sector: "AI Infrastructure", hq: "San Francisco, CA" },
  { id: "co_harbor", name: "Harbor Fintech", sector: "Fintech", hq: "New York, NY" },
  { id: "co_solstice", name: "Solstice Energy", sector: "Climate", hq: "Denver, CO" },
  { id: "co_meadowlark", name: "Meadowlark Foods", sector: "Consumer", hq: "Portland, OR" },
  { id: "co_terra", name: "Terra Compute", sector: "AI Infrastructure", hq: "Sunnyvale, CA" },
];

const FUND_ONE: SeedInvestment[] = [
  {
    id: "inv_f1_northwind",
    company: "co_northwind",
    entryStage: "Series A",
    status: "active",
    entryDate: "2019-06-01",
    events: [
      { kind: "invest", amount: "4000000", eventDate: "2019-06-01" },
      { kind: "valuation", amount: "12000000", eventDate: "2024-06-30", note: "Series C mark" },
    ],
  },
  {
    id: "inv_f1_cobalt",
    company: "co_cobalt",
    entryStage: "Series A",
    status: "realized",
    entryDate: "2019-09-01",
    events: [
      { kind: "invest", amount: "3000000", eventDate: "2019-09-01" },
      { kind: "distribution", amount: "9500000", eventDate: "2023-05-01", note: "Acquisition proceeds" },
    ],
  },
  {
    id: "inv_f1_pallas",
    company: "co_pallas",
    entryStage: "Seed",
    status: "written_off",
    entryDate: "2020-01-15",
    events: [
      { kind: "invest", amount: "2500000", eventDate: "2020-01-15" },
      { kind: "valuation", amount: "0", eventDate: "2022-12-31", note: "Wind-down" },
    ],
  },
  {
    id: "inv_f1_vantage",
    company: "co_vantage",
    entryStage: "Series B",
    status: "active",
    entryDate: "2020-03-01",
    events: [
      { kind: "invest", amount: "5000000", eventDate: "2020-03-01" },
      { kind: "valuation", amount: "8500000", eventDate: "2024-06-30" },
    ],
  },
  {
    id: "inv_f1_lumen",
    company: "co_lumen",
    entryStage: "Series A",
    status: "active",
    entryDate: "2020-07-01",
    events: [
      { kind: "invest", amount: "3500000", eventDate: "2020-07-01" },
      { kind: "distribution", amount: "2000000", eventDate: "2023-11-01", note: "Secondary sale" },
      { kind: "valuation", amount: "6200000", eventDate: "2024-06-30" },
    ],
  },
  {
    id: "inv_f1_beacon",
    company: "co_beacon",
    entryStage: "Series B",
    status: "realized",
    entryDate: "2019-11-01",
    events: [
      { kind: "invest", amount: "4000000", eventDate: "2019-11-01" },
      { kind: "distribution", amount: "6800000", eventDate: "2024-02-01", note: "Trade sale" },
    ],
  },
];

const FUND_TWO: SeedInvestment[] = [
  {
    id: "inv_f2_aurora",
    company: "co_aurora",
    entryStage: "Series A",
    status: "active",
    entryDate: "2022-05-01",
    events: [
      { kind: "invest", amount: "6000000", eventDate: "2022-05-01" },
      { kind: "valuation", amount: "9000000", eventDate: "2024-06-30" },
    ],
  },
  {
    id: "inv_f2_continuum",
    company: "co_continuum",
    entryStage: "Series B",
    status: "active",
    entryDate: "2022-09-01",
    events: [
      { kind: "invest", amount: "8000000", eventDate: "2022-09-01" },
      { kind: "valuation", amount: "20000000", eventDate: "2024-06-30", note: "Series C up round" },
    ],
  },
  {
    id: "inv_f2_harbor",
    company: "co_harbor",
    entryStage: "Series A",
    status: "active",
    entryDate: "2023-01-15",
    events: [
      { kind: "invest", amount: "5000000", eventDate: "2023-01-15" },
      { kind: "valuation", amount: "5500000", eventDate: "2024-06-30" },
    ],
  },
  {
    id: "inv_f2_solstice",
    company: "co_solstice",
    entryStage: "Seed (SAFE)",
    status: "active",
    entryDate: "2023-04-01",
    events: [
      { kind: "invest", amount: "7000000", eventDate: "2023-04-01", note: "SAFE, cap $70M — awaiting priced round" },
      { kind: "valuation", amount: "7000000", eventDate: "2024-06-30", note: "Held at cost pending conversion" },
    ],
  },
  {
    id: "inv_f2_meadowlark",
    company: "co_meadowlark",
    entryStage: "Series A",
    status: "active",
    entryDate: "2023-08-01",
    events: [
      { kind: "invest", amount: "3000000", eventDate: "2023-08-01" },
      { kind: "valuation", amount: "2400000", eventDate: "2024-06-30", note: "Down round" },
    ],
  },
  {
    id: "inv_f2_terra",
    company: "co_terra",
    entryStage: "Series B",
    status: "active",
    entryDate: "2023-10-01",
    events: [
      { kind: "invest", amount: "9000000", eventDate: "2023-10-01" },
      { kind: "valuation", amount: "15000000", eventDate: "2024-06-30" },
    ],
  },
];

const SPV_INVESTMENTS: SeedInvestment[] = [
  {
    id: "inv_spv_continuum",
    company: "co_continuum",
    entryStage: "Series C (SPV)",
    status: "active",
    entryDate: "2023-11-01",
    events: [
      { kind: "invest", amount: "10000000", eventDate: "2023-11-01" },
      { kind: "valuation", amount: "14000000", eventDate: "2024-06-30" },
    ],
  },
];

function seed() {
  const existing = db.select().from(firms).all();
  if (existing.length > 0) {
    console.log("[db:seed] firm already present; skipping seed (idempotent).");
    sqlite.close();
    return;
  }

  const firmId = "firm_meridian";

  db.transaction((tx) => {
    tx.insert(firms).values({
      id: firmId,
      name: "Meridian Ventures",
      reportingCurrency: "USD",
    }).run();

    for (const c of COMPANIES) {
      tx.insert(companies).values({
        id: c.id,
        firmId,
        name: c.name,
        sector: c.sector,
        hqLocation: c.hq,
      }).run();
    }

    const fundDefs = [
      {
        id: "fund_one",
        name: "Meridian Ventures Fund I",
        vintageYear: 2019,
        commitment: "120000000",
        strategy: "Early-stage venture",
        inceptionDate: "2019-04-01",
        investments: FUND_ONE,
      },
      {
        id: "fund_two",
        name: "Meridian Ventures Fund II",
        vintageYear: 2022,
        commitment: "200000000",
        strategy: "Early-growth venture",
        inceptionDate: "2022-03-01",
        investments: FUND_TWO,
      },
      {
        id: "spv_continuum",
        name: "Meridian Continuum SPV",
        vintageYear: 2023,
        commitment: "12000000",
        strategy: "Single-asset SPV",
        inceptionDate: "2023-10-01",
        investments: SPV_INVESTMENTS,
      },
    ];

    for (const f of fundDefs) {
      tx.insert(funds).values({
        id: f.id,
        firmId,
        name: f.name,
        vintageYear: f.vintageYear,
        currency: "USD",
        commitment: f.commitment,
        strategy: f.strategy,
        inceptionDate: f.inceptionDate,
      }).run();

      for (const inv of f.investments) {
        tx.insert(investments).values({
          id: inv.id,
          fundId: f.id,
          companyId: inv.company,
          currency: "USD",
          entryStage: inv.entryStage,
          status: inv.status,
          entryDate: inv.entryDate,
        }).run();

        for (let i = 0; i < inv.events.length; i++) {
          const e = inv.events[i]!;
          tx.insert(investmentEvents).values({
            id: `${inv.id}_evt_${i}`,
            investmentId: inv.id,
            kind: e.kind,
            amount: e.amount,
            eventDate: e.eventDate,
            note: e.note ?? "",
          }).run();
        }
      }
    }
  });

  console.log("[db:seed] seeded 1 firm, 3 vehicles, 12 companies, 13 investments.");
  sqlite.close();
}

seed();
