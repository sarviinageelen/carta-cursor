import { eq } from "drizzle-orm";
import { buildConstructionForecast } from "@/domain/construction";
import { getDb, schema } from "@/server/db";
import { postJournal } from "@/server/services/accounting";
import { issueCapitalCall, recordReceipt } from "@/server/services/capital";
import { saveDraftValuation, postValuation } from "@/server/services/valuations";
import { DEFAULT_DEMO_CLOCK } from "@/server/clock";
import fs from "node:fs";
import path from "node:path";

const T = DEFAULT_DEMO_CLOCK;

function stamp(date: string) {
  return `${date}T12:00:00.000Z`;
}

export function seed() {
  const db = getDb();
  const existing = db.select().from(schema.firms).where(eq(schema.firms.id, "firm_northbridge")).get();
  if (existing) return { seeded: false };

  db.insert(schema.demoSettings)
    .values({ id: "global", demoClock: T, warehouseRefreshedAt: "2026-09-16T11:50:00.000Z" })
    .run();

  db.insert(schema.firms)
    .values([
      { id: "firm_northbridge", name: "Northbridge Capital", legalName: "Northbridge Capital Partners LP", createdAt: stamp("2019-01-01") },
      { id: "firm_harborstone", name: "Harborstone", legalName: "Harborstone Partners LLC", createdAt: stamp("2021-06-01") },
    ])
    .run();

  db.insert(schema.legalEntities)
    .values([
      { id: "manco_nb", firmId: "firm_northbridge", name: "Northbridge Management", legalName: "Northbridge Management LLC", kind: "manco", currency: "USD", parentEntityId: null, inceptionDate: "2019-01-01", endDate: null, strategyTemplate: null, vehicleStructure: "llc", evergreen: false, noConstruction: false, commitments: "0", gpCommitment: "0", callCadence: null, status: "active", version: 1, createdAt: stamp("2019-01-01") },
      { id: "gp_nb", firmId: "firm_northbridge", name: "Northbridge GP", legalName: "Northbridge GP LLC", kind: "gp", currency: "USD", parentEntityId: "manco_nb", inceptionDate: "2019-01-01", endDate: null, strategyTemplate: null, vehicleStructure: "llc", evergreen: false, noConstruction: false, commitments: "0", gpCommitment: "0", callCadence: null, status: "active", version: 1, createdAt: stamp("2019-01-01") },
      { id: "fund_nb_i", firmId: "firm_northbridge", name: "Northbridge Ventures I", legalName: "Northbridge Ventures I LP", kind: "fund", currency: "USD", parentEntityId: "gp_nb", inceptionDate: "2020-01-01", endDate: "2030-12-31", strategyTemplate: "venture_construction", vehicleStructure: "lp", evergreen: false, noConstruction: false, commitments: "100000000", gpCommitment: "2000000", callCadence: "quarterly", status: "active", version: 1, createdAt: stamp("2020-01-01") },
      { id: "fund_nb_ii", firmId: "firm_northbridge", name: "Northbridge Ventures II", legalName: "Northbridge Ventures II LP", kind: "fund", currency: "USD", parentEntityId: "gp_nb", inceptionDate: "2024-01-01", endDate: "2034-12-31", strategyTemplate: "venture_construction", vehicleStructure: "lp", evergreen: false, noConstruction: false, commitments: "180000000", gpCommitment: "3600000", callCadence: "quarterly", status: "active", version: 1, createdAt: stamp("2024-01-01") },
      { id: "fund_ridgeway", firmId: "firm_northbridge", name: "Ridgeway Seed Fund", legalName: "Ridgeway Seed Fund LP", kind: "fund", currency: "USD", parentEntityId: "gp_nb", inceptionDate: "2023-01-01", endDate: "2033-12-31", strategyTemplate: "venture_construction", vehicleStructure: "lp", evergreen: false, noConstruction: false, commitments: "40000000", gpCommitment: "800000", callCadence: "as_needed", status: "active", version: 1, createdAt: stamp("2023-01-01") },
      { id: "spv_helios", firmId: "firm_northbridge", name: "Helios SPV I", legalName: "Helios SPV I LLC", kind: "spv", currency: "USD", parentEntityId: "gp_nb", inceptionDate: "2026-03-01", endDate: null, strategyTemplate: "spv_no_construction", vehicleStructure: "llc", evergreen: false, noConstruction: true, commitments: "12000000", gpCommitment: "0", callCadence: "as_needed", status: "forming", version: 1, createdAt: stamp("2026-03-01") },
      { id: "fund_harbor", firmId: "firm_harborstone", name: "Harborstone Fund I", legalName: "Harborstone Fund I LP", kind: "fund", currency: "USD", parentEntityId: null, inceptionDate: "2022-01-01", endDate: "2032-12-31", strategyTemplate: "venture_construction", vehicleStructure: "lp", evergreen: false, noConstruction: false, commitments: "50000000", gpCommitment: "1000000", callCadence: "quarterly", status: "active", version: 1, createdAt: stamp("2022-01-01") },
    ])
    .run();

  const users = [
    { id: "user_alex", email: "alex.chen@northbridge.example", displayName: "Alex Chen", persona: "investment_editor", firmId: "firm_northbridge", investorId: null, companyId: null },
    { id: "user_morgan", email: "morgan.vale@northbridge.example", displayName: "Morgan Vale", persona: "fund_ops", firmId: "firm_northbridge", investorId: null, companyId: null },
    { id: "user_priya", email: "priya.shah@northbridge.example", displayName: "Priya Shah", persona: "investor_relations", firmId: "firm_northbridge", investorId: null, companyId: null },
    { id: "user_lp_atlantic", email: "lp.atlantic@investors.example", displayName: "Atlantic Endowment (LP)", persona: "lp", firmId: "firm_northbridge", investorId: "lp_atlantic", companyId: null },
    { id: "user_lp_meridian", email: "lp.meridian@investors.example", displayName: "Meridian Family Office (LP)", persona: "lp", firmId: "firm_northbridge", investorId: "lp_meridian", companyId: null },
    { id: "user_cfo", email: "cfo@lumenforge.example", displayName: "Jordan Hale (Lumenforge)", persona: "company_submitter", firmId: "firm_northbridge", investorId: null, companyId: "co_lumenforge" },
    { id: "user_auditor", email: "auditor@fieldstone.example", displayName: "Fieldstone Audit", persona: "auditor", firmId: "firm_northbridge", investorId: null, companyId: null },
    { id: "user_harbor", email: "harbor.admin@harborstone.example", displayName: "Harborstone Admin", persona: "investment_editor", firmId: "firm_harborstone", investorId: null, companyId: null },
    { id: "user_borrower", email: "cfo@voltgrid.example", displayName: "VoltGrid Borrower", persona: "borrower", firmId: "firm_northbridge", investorId: null, companyId: "co_volt" },
  ];
  db.insert(schema.users)
    .values(users.map((user) => ({ ...user, createdAt: stamp("2024-01-01") })))
    .run();
  db.insert(schema.memberships)
    .values(users.filter((user) => user.firmId).map((user) => ({ id: `mem_${user.id}`, userId: user.id, firmId: user.firmId!, role: user.persona, entityScopeJson: null })))
    .run();

  db.insert(schema.disclosurePolicies)
    .values([
      { id: "pol_full", firmId: "firm_northbridge", name: "Full current", cutoffDate: null, hideOtherLpReturns: true, visibleTabsJson: JSON.stringify(["holdings", "notices", "documents", "capital", "performance"]) },
      { id: "pol_cutoff", firmId: "firm_northbridge", name: "Through 2025-12-31", cutoffDate: "2025-12-31", hideOtherLpReturns: true, visibleTabsJson: JSON.stringify(["holdings", "notices", "documents", "capital"]) },
    ])
    .run();

  const companyDefs = [
    ["co_lumenforge", "Lumenforge", "enterprise_saas", "Series B"],
    ["co_harborline", "Harborline Robotics", "robotics", "Series A"],
    ["co_nimbus", "Nimbus Analytics", "data", "Series A"],
    ["co_petal", "Petal Health", "healthtech", "Seed"],
    ["co_arcadia", "Arcadia Climate", "climate", "Series A"],
    ["co_keel", "Keel Payments", "fintech", "Series B"],
    ["co_volt", "VoltGrid", "energy", "Series A"],
    ["co_quartz", "Quartz Bio", "biotech", "Seed"],
    ["co_sable", "Sable Logistics", "logistics", "Series A"],
    ["co_oriole", "Oriole Media", "media", "Seed"],
    ["co_pine", "Pinecone Storage", "infrastructure", "written_off"],
    ["co_wren", "Wren Security", "cyber", "SAFE"],
  ] as const;
  db.insert(schema.companies)
    .values(
      companyDefs.map(([id, name, sector, stage]) => ({
        id,
        firmId: "firm_northbridge",
        name,
        legalName: `${name} Inc.`,
        sector,
        stage,
        website: `https://${id.replace("co_", "")}.example`,
        country: "US",
        status: stage === "written_off" ? "written_off" : "active",
        createdAt: stamp("2021-01-01"),
      })),
    )
    .run();

  const investorDefs = [
    ["lp_atlantic", "Atlantic Endowment", "endowment", true, "pol_full", "closed"],
    ["lp_meridian", "Meridian Family Office", "family_office", false, "pol_cutoff", "closed"],
    ["lp_northlight", "Northlight Pension", "pension", true, "pol_full", "closed"],
    ["lp_cedar", "Cedar Hill Partners", "fund_of_funds", true, "pol_full", "closed"],
    ["lp_oakmont", "Oakmont Capital", "family_office", true, "pol_full", "closed"],
    ["lp_blue", "Blue Harbor", "endowment", true, "pol_full", "closed"],
    ["lp_solstice", "Solstice Foundation", "foundation", true, "pol_full", "in_progress"],
    ["lp_pinnacle", "Pinnacle Insurance", "insurance", true, "pol_full", "invited"],
    ["lp_riverton", "Riverton Trust", "family_office", true, "pol_full", "closed"],
    ["lp_westgate", "Westgate University", "endowment", true, "pol_full", "closed"],
    ["lp_polar", "Polar Star", "sovereign", true, "pol_full", "closed"],
    ["lp_ember", "Emberstone", "family_office", true, "pol_full", "soft_circled"],
    ["lp_quiet", "Quiet Harbor", "fund_of_funds", true, "pol_full", "closed"],
    ["lp_southwind", "Southwind", "family_office", true, "pol_full", "closed"],
    ["lp_horizon", "Horizon Trust", "trust", true, "pol_full", "closed"],
  ] as const;
  db.insert(schema.investors)
    .values(
      investorDefs.map(([id, name, type, bank, policy, stage]) => ({
        id,
        firmId: "firm_northbridge",
        name,
        legalName: `${name} LP`,
        type,
        country: "US",
        relationshipOwnerId: "user_priya",
        fundraisingStage: stage,
        bankDetailsConfirmed: bank,
        bankAccountLast4: bank ? "4410" : null,
        disclosurePolicyId: policy,
        kycStatus: id === "lp_ember" ? "flagged_review" : "cleared",
        createdAt: stamp("2023-01-01"),
      })),
    )
    .run();

  seedDeals(db);
  seedConstruction(db);
  seedInvestments(db);
  seedCrmAndClosings(db);
  seedCapitalAndAccounting(db);
  seedKpisValuations(db);
  seedOpsModules(db);
  seedDocuments();

  return { seeded: true };
}

function seedDeals(db: ReturnType<typeof getDb>) {
  const stages = ["watch", "intro", "diligence", "ic", "won", "passed"];
  const rows = [];
  for (let i = 0; i < 20; i += 1) {
    const company = [
      "co_lumenforge",
      "co_harborline",
      "co_nimbus",
      "co_petal",
      "co_arcadia",
      "co_keel",
      "co_volt",
      "co_quartz",
      "co_sable",
      "co_oriole",
      "co_pine",
      "co_wren",
    ][i % 12];
    rows.push({
      id: `deal_${String(i + 1).padStart(2, "0")}`,
      firmId: "firm_northbridge",
      companyId: company,
      name: `Opportunity ${i + 1}`,
      stage: stages[i % stages.length],
      source: i % 3 === 0 ? "inbound" : "network",
      adviser: i % 4 === 0 ? "Riverside Advisors" : null,
      ownerId: "user_alex",
      amount: String(2_000_000 + i * 250_000),
      currency: "USD",
      nextStep: "Follow up",
      createdAt: stamp("2025-01-15"),
    });
  }
  db.insert(schema.deals).values(rows).run();
  db.insert(schema.interactions)
    .values([
      { id: "int_1", firmId: "firm_northbridge", companyId: "co_lumenforge", investorId: null, dealId: "deal_01", kind: "note", subject: "IC memo draft", body: "Synthetic IC notes for Lumenforge expansion round.", occurredAt: stamp("2026-08-01"), sourceProvenance: "manual" },
      { id: "int_2", firmId: "firm_northbridge", companyId: null, investorId: "lp_atlantic", dealId: null, kind: "meeting", subject: "Annual meeting", body: "Discussed Fund II pacing and remaining commitment.", occurredAt: stamp("2026-06-12"), sourceProvenance: "manual" },
      { id: "int_3", firmId: "firm_northbridge", companyId: "co_wren", investorId: null, dealId: "deal_12", kind: "email_fixture", subject: "Intro: Wren Security SAFE", body: "Fixture-parsed intro email. Not a live inbox connection.", occurredAt: stamp("2026-04-02"), sourceProvenance: "email_fixture" },
    ])
    .run();
}

function seedConstruction(db: ReturnType<typeof getDb>) {
  for (const fund of [
    { id: "cfg_nb_i", fundId: "fund_nb_i", inception: "2020-01-01", end: "2030-12-31", commitments: "100000000", gp: "2000000" },
    { id: "cfg_nb_ii", fundId: "fund_nb_ii", inception: "2024-01-01", end: "2034-12-31", commitments: "180000000", gp: "3600000" },
    { id: "cfg_ridge", fundId: "fund_ridgeway", inception: "2023-01-01", end: "2033-12-31", commitments: "40000000", gp: "800000" },
  ]) {
    db.insert(schema.constructionConfigs)
      .values({
        id: fund.id,
        fundId: fund.fundId,
        version: 1,
        name: "Inception construction",
        currency: "USD",
        inceptionDate: fund.inception,
        endDate: fund.end,
        commitments: fund.commitments,
        gpCommitment: fund.gp,
        callCadence: "quarterly",
        vehicleStructure: "lp",
        evergreen: false,
        noConstruction: false,
        forecastHorizonMonths: 120,
        status: "active",
        updatedAt: stamp(T),
      })
      .run();
    const profileId = `prof_${fund.id}`;
    db.insert(schema.sectorProfiles).values({ id: profileId, constructionId: fund.id, name: "Core venture", sortOrder: 0 }).run();
    db.insert(schema.sectorStages)
      .values([
        { id: `${profileId}_seed`, profileId, name: "Seed", sortOrder: 0, graduation: "0.60", exit: "0.15", monthsToNext: 18, monthsToExit: 24, roundSize: "8000000", preMoney: "32000000", postMoney: "40000000", optionPoolDilution: "0.10", exitValue: "40000000", followOnCheck: "0" },
        { id: `${profileId}_a`, profileId, name: "Series A", sortOrder: 1, graduation: "0.50", exit: "0.20", monthsToNext: 18, monthsToExit: 24, roundSize: "20000000", preMoney: "80000000", postMoney: "100000000", optionPoolDilution: "0.10", exitValue: "120000000", followOnCheck: "2000000" },
        { id: `${profileId}_b`, profileId, name: "Series B", sortOrder: 2, graduation: "0", exit: "0.40", monthsToNext: 0, monthsToExit: 36, roundSize: "40000000", preMoney: "200000000", postMoney: "240000000", optionPoolDilution: "0", exitValue: "300000000", followOnCheck: "3000000" },
      ])
      .run();
    const budget = fund.fundId === "fund_nb_ii" ? "90000000" : fund.fundId === "fund_nb_i" ? "50000000" : "25000000";
    db.insert(schema.allocations)
      .values({
        id: `alloc_${fund.id}`,
        constructionId: fund.id,
        profileId,
        name: "Core seed/A",
        entryStageId: `${profileId}_seed`,
        budget,
        initialCheck: "2000000",
        initialOwnership: "0.12",
        followOnAmount: "5000000",
        followOnOwnership: "0.08",
        followOnParticipation: true,
        horizonMonths: 36,
      })
      .run();
    db.insert(schema.feeProfiles).values({ id: `fee_${fund.id}`, constructionId: fund.id, name: "Standard 2%" }).run();
    db.insert(schema.feeTiers)
      .values({ id: `tier_${fund.id}`, feeProfileId: `fee_${fund.id}`, startDate: fund.inception, endDate: null, rate: "0.02", basis: "commitments", feeRecycling: true })
      .run();
    db.insert(schema.expenseSchedules)
      .values({ id: `exp_${fund.id}`, constructionId: fund.id, name: "Fund admin", monthlyAmount: "25000", startDate: fund.inception, endDate: null })
      .run();
    db.insert(schema.recyclingPolicies)
      .values({ id: `rec_${fund.id}`, constructionId: fund.id, recyclablePct: "0.25", capVsCommitments: "0.20", termMonths: 60, useAnticipatedProceeds: false, feeRecyclingCap: "0.10" })
      .run();
    db.insert(schema.fundWaterfallConfigs)
      .values({ id: `wf_${fund.id}`, constructionId: fund.id, structure: "european", preferredRate: "0.08", catchUp: true, carryRate: "0.20", profile: "fund_waterfall_european_v1" })
      .run();
    db.insert(schema.modeledLps)
      .values({ id: `mlp_${fund.id}`, constructionId: fund.id, name: "Aggregate LP", commitment: fund.commitments, feeProfileId: `fee_${fund.id}`, customSplitJson: null, investorId: null })
      .run();
  }
  const planCheck = buildConstructionForecast({
    inceptionDate: "2024-01-01",
    currency: "USD",
    commitments: "180000000",
    gpCommitment: "3600000",
    allocations: [{ id: "alloc_cfg_nb_ii", name: "Core", entryStageId: "prof_cfg_nb_ii_seed", budget: "90000000", initialCheck: "2000000", initialOwnership: "0.12", followOnParticipation: true, horizonMonths: 36 }],
    stagesByProfile: {
      prof_cfg_nb_ii: [
        { id: "prof_cfg_nb_ii_seed", name: "Seed", sortOrder: 0, graduation: "0.60", exit: "0.15", monthsToNext: 18, monthsToExit: 24, exitValue: "40000000", optionPoolDilution: "0.10", followOnCheck: "0" },
        { id: "prof_cfg_nb_ii_a", name: "A", sortOrder: 1, graduation: "0.50", exit: "0.20", monthsToNext: 18, monthsToExit: 24, exitValue: "120000000", optionPoolDilution: "0.10", followOnCheck: "2000000" },
        { id: "prof_cfg_nb_ii_b", name: "B", sortOrder: 2, graduation: "0", exit: "0.40", monthsToNext: 0, monthsToExit: 36, exitValue: "300000000", optionPoolDilution: "0", followOnCheck: "3000000" },
      ],
    },
    allocationProfileId: { alloc_cfg_nb_ii: "prof_cfg_nb_ii" },
  });
  if (planCheck.status !== "ok") throw new Error(planCheck.message);
}

function seedInvestments(db: ReturnType<typeof getDb>) {
  const items: Array<{
    id: string;
    fundId: string;
    companyId: string | null;
    name: string;
    status: string;
    events: Array<Record<string, unknown>>;
    portfolioFundId?: string;
  }> = [
    { id: "inv_lumen_i", fundId: "fund_nb_i", companyId: "co_lumenforge", name: "Lumenforge", status: "unrealized", events: [
      { kind: "financing", date: "2020-06-01", amount: "3000000", ownership: "0.18", postMoney: "20000000", isProjected: false },
      { kind: "financing", date: "2022-03-01", amount: "2000000", ownership: "0.12", postMoney: "80000000", isProjected: false },
      { kind: "valuation_update", date: "2026-06-30", amount: "140000000", ownership: "0.12", isProjected: false },
      { kind: "exit", date: "2028-06-01", amount: "24000000", isProjected: true },
    ]},
    { id: "inv_keel_i", fundId: "fund_nb_i", companyId: "co_keel", name: "Keel Payments", status: "realized", events: [
      { kind: "financing", date: "2020-09-01", amount: "4000000", ownership: "0.15", postMoney: "28000000", isProjected: false },
      { kind: "exit", date: "2025-11-15", amount: "18000000", ownership: "0", isProjected: false },
    ]},
    { id: "inv_pine_i", fundId: "fund_nb_i", companyId: "co_pine", name: "Pinecone Storage", status: "written_off", events: [
      { kind: "financing", date: "2021-02-01", amount: "2500000", ownership: "0.20", postMoney: "12500000", isProjected: false },
      { kind: "exit", date: "2024-08-01", amount: "0", ownership: "0", isProjected: false, notes: "Write-off" },
    ]},
    { id: "inv_lumen_ii", fundId: "fund_nb_ii", companyId: "co_lumenforge", name: "Lumenforge", status: "unrealized", events: [
      { kind: "financing", date: "2024-04-01", amount: "5000000", ownership: "0.04", postMoney: "140000000", isProjected: false },
      { kind: "exit", date: "2029-04-01", amount: "16000000", isProjected: true },
    ]},
    { id: "inv_harbor_ii", fundId: "fund_nb_ii", companyId: "co_harborline", name: "Harborline Robotics", status: "unrealized", events: [
      { kind: "financing", date: "2024-07-15", amount: "3000000", ownership: "0.10", postMoney: "40000000", isProjected: false },
      { kind: "exit", date: "2029-07-15", amount: "12000000", isProjected: true },
    ]},
    { id: "inv_nimbus_ii", fundId: "fund_nb_ii", companyId: "co_nimbus", name: "Nimbus Analytics", status: "unrealized", events: [
      { kind: "financing", date: "2025-01-10", amount: "2500000", ownership: "0.11", postMoney: "28000000", isProjected: false },
      { kind: "exit", date: "2029-01-10", amount: "9000000", isProjected: true },
    ]},
    { id: "inv_wren_ii", fundId: "fund_nb_ii", companyId: "co_wren", name: "Wren Security", status: "planned", events: [
      { kind: "financing", date: "2026-02-01", amount: "1500000", ownership: null, securityType: "SAFE", valuationCap: "18000000", isProjected: false, notes: "Unconverted SAFE" },
      { kind: "ownership_update", date: "2027-02-01", amount: "0", ownership: "0.07", convertedOwnership: "0.07", isProjected: true, notes: "Assumed conversion — not verified from cap alone" },
      { kind: "exit", date: "2030-02-01", amount: "6000000", isProjected: true },
    ]},
    { id: "inv_fof_ii", fundId: "fund_nb_ii", companyId: null, name: "Ridgeway Seed Fund interest", status: "unrealized", portfolioFundId: "fund_ridgeway", events: [
      { kind: "financing", date: "2024-06-01", amount: "5000000", ownership: "0.125", isProjected: false, notes: "FoF participation in Ridgeway" },
    ]},
  ];
  for (const item of items) {
    db.insert(schema.investments)
      .values({
        id: item.id,
        fundId: item.fundId,
        companyId: item.companyId,
        portfolioFundId: item.portfolioFundId ?? null,
        name: item.name,
        status: item.status,
        currency: "USD",
        entryStageId: null,
        profileId: null,
        fofSourceForecast: item.portfolioFundId ? "current" : null,
        fofAmount: item.portfolioFundId ? "5000000" : null,
        version: 1,
        createdAt: stamp("2024-01-01"),
        updatedAt: stamp(T),
      })
      .run();
    const baseId = `${item.id}_base`;
    db.insert(schema.investmentCases)
      .values([
        { id: baseId, investmentId: item.id, name: "Base", probability: "0.60", isBase: true, clonedFromId: null },
        { id: `${item.id}_up`, investmentId: item.id, name: "Upside", probability: "0.25", isBase: false, clonedFromId: baseId },
        { id: `${item.id}_dn`, investmentId: item.id, name: "Downside", probability: "0.15", isBase: false, clonedFromId: baseId },
      ])
      .run();
    db.insert(schema.investmentEvents)
      .values(
        item.events.map((event, index) => ({
          id: `${item.id}_ev_${index}`,
          caseId: baseId,
          kind: String(event.kind),
          date: String(event.date),
          amount: String(event.amount ?? "0"),
          ownership: (event.ownership as string | null) ?? null,
          preMoney: null,
          postMoney: (event.postMoney as string | null) ?? null,
          roundCurrency: "USD",
          fxRate: "1",
          fxRateDate: String(event.date),
          securityType: (event.securityType as string | null) ?? "preferred",
          valuationCap: (event.valuationCap as string | null) ?? null,
          convertedOwnership: (event.convertedOwnership as string | null) ?? null,
          isProjected: Boolean(event.isProjected),
          sourceProvenance: "manual",
          sourceRecordId: null,
          notes: (event.notes as string | null) ?? null,
        })),
      )
      .run();
  }
  db.insert(schema.investmentLiqPrefs)
    .values({
      id: "pref_lumen",
      caseId: "inv_lumen_ii_base",
      name: "Series B preferred",
      seniority: 0,
      type: "non_participating",
      preferenceAmount: "5000000",
      participationCap: null,
      fullyDilutedOwnership: "0.04",
    })
    .run();
  db.insert(schema.fundScenarios)
    .values([
      { id: "scen_delay", fundId: "fund_nb_ii", name: "Delayed exits", status: "saved", overridesJson: JSON.stringify({ exitDelayMonths: 12 }), resultJson: JSON.stringify({ label: "Not yet recalculated on seed" }), inputVersion: 1, calculatedInputVersion: 1, stale: false, createdAt: stamp("2026-04-01"), updatedAt: stamp("2026-04-01") },
      { id: "scen_followon", fundId: "fund_nb_ii", name: "Heavier follow-on", status: "saved", overridesJson: JSON.stringify({ followOnParticipation: true, followOnBoost: "0.25" }), resultJson: null, inputVersion: 1, calculatedInputVersion: null, stale: true, createdAt: stamp("2026-05-01"), updatedAt: stamp("2026-05-01") },
      { id: "scen_baseplus", fundId: "fund_nb_ii", name: "Select upside cases", status: "draft", overridesJson: JSON.stringify({ caseSelections: { inv_lumen_ii: "inv_lumen_ii_up" } }), resultJson: null, inputVersion: 1, calculatedInputVersion: null, stale: true, createdAt: stamp("2026-07-01"), updatedAt: stamp("2026-07-01") },
    ])
    .run();
  db.insert(schema.monthlyActualOverrides)
    .values({ id: "ov_exp", fundId: "fund_nb_ii", month: "2026-08", field: "expenses", amount: "31000", updatedAt: stamp(T) })
    .run();
  db.insert(schema.multiFundViews)
    .values({ id: "mfv_usd", firmId: "firm_northbridge", name: "USD venture vehicles", fundIdsJson: JSON.stringify(["fund_nb_i", "fund_nb_ii"]), currency: "USD" })
    .run();
}

function seedCrmAndClosings(db: ReturnType<typeof getDb>) {
  const closedLps = ["lp_atlantic", "lp_meridian", "lp_northlight", "lp_cedar", "lp_oakmont", "lp_blue", "lp_riverton", "lp_westgate", "lp_polar", "lp_quiet", "lp_southwind", "lp_horizon"];
  const amounts: Record<string, string> = {
    lp_atlantic: "25000000",
    lp_meridian: "15000000",
    lp_northlight: "20000000",
    lp_cedar: "18000000",
    lp_oakmont: "10000000",
    lp_blue: "12000000",
    lp_riverton: "8000000",
    lp_westgate: "16000000",
    lp_polar: "22000000",
    lp_quiet: "9000000",
    lp_southwind: "7000000",
    lp_horizon: "8000000",
  };
  for (const lp of closedLps) {
    db.insert(schema.closings)
      .values({
        id: `cls_${lp}_ii`,
        fundId: "fund_nb_ii",
        investorId: lp,
        status: "countersigned",
        targetAmount: amounts[lp],
        softCommitment: amounts[lp],
        legalCommitment: amounts[lp],
        questionnaireStatus: "complete",
        signatureSimulatedAt: stamp("2024-03-01"),
        countersignedAt: stamp("2024-03-15"),
        createdAt: stamp("2024-02-01"),
      })
      .run();
    db.insert(schema.commitments)
      .values({
        id: `cmt_${lp}_ii`,
        fundId: "fund_nb_ii",
        investorId: lp,
        amount: amounts[lp],
        currency: "USD",
        status: "closed",
        closingId: `cls_${lp}_ii`,
        createdAt: stamp("2024-03-15"),
      })
      .run();
  }
  db.insert(schema.closings)
    .values([
      { id: "cls_solstice", fundId: "fund_nb_ii", investorId: "lp_solstice", status: "signed", targetAmount: "10000000", softCommitment: "10000000", legalCommitment: null, questionnaireStatus: "complete", signatureSimulatedAt: stamp("2026-08-20"), countersignedAt: null, createdAt: stamp("2026-07-01") },
      { id: "cls_pinnacle", fundId: "fund_nb_ii", investorId: "lp_pinnacle", status: "invited", targetAmount: "15000000", softCommitment: "12000000", legalCommitment: null, questionnaireStatus: "pending", signatureSimulatedAt: null, countersignedAt: null, createdAt: stamp("2026-09-01") },
    ])
    .run();
  db.insert(schema.commitments)
    .values({
      id: "cmt_atlantic_i",
      fundId: "fund_nb_i",
      investorId: "lp_atlantic",
      amount: "20000000",
      currency: "USD",
      status: "closed",
      closingId: null,
      createdAt: stamp("2020-03-01"),
    })
    .run();
}

function seedCapitalAndAccounting(db: ReturnType<typeof getDb>) {
  const callId = issueCapitalCall({
    fundId: "fund_nb_ii",
    amount: "18000000",
    noticeDate: "2025-03-01",
    effectiveDate: "2025-03-15",
    dueDate: "2025-03-15",
    memo: "Fund II initial call",
  });
  const allocations = db.select().from(schema.capitalAllocations).all().filter((row) => row.activityId === callId);
  for (const allocation of allocations) {
    if (allocation.investorId === "lp_meridian") {
      recordReceipt({
        activityId: callId,
        investorId: allocation.investorId,
        amount: (Number(allocation.amount) / 2).toFixed(2),
        receivedDate: "2025-03-20",
      });
    } else {
      recordReceipt({
        activityId: callId,
        investorId: allocation.investorId,
        amount: allocation.amount,
        receivedDate: "2025-03-18",
      });
    }
  }
  postJournal({
    entityId: "fund_nb_ii",
    date: "2024-04-01",
    effectiveDate: "2024-04-01",
    memo: "Lumenforge initial investment",
    sourceType: "investment_funding",
    sourceId: "inv_lumen_ii_ev_0",
    currency: "USD",
    lines: [
      { accountCode: "1400", accountName: "Investments at FV", debit: "5000000.00" },
      { accountCode: "1000", accountName: "Cash", credit: "5000000.00" },
    ],
  });
  postJournal({
    entityId: "manco_nb",
    date: "2026-08-01",
    effectiveDate: "2026-08-01",
    memo: "Allocated legal spend",
    sourceType: "manco_expense",
    sourceId: "exp_seed_1",
    currency: "USD",
    lines: [
      { accountCode: "5100", accountName: "Professional fees", debit: "40000.00" },
      { accountCode: "1000", accountName: "Cash", credit: "40000.00" },
    ],
  });
  postJournal({
    entityId: "fund_nb_ii",
    date: "2026-08-01",
    effectiveDate: "2026-08-01",
    memo: "Intercompany payable for legal allocation",
    sourceType: "intercompany",
    sourceId: "exp_seed_1_fund",
    currency: "USD",
    lines: [
      { accountCode: "5100", accountName: "Professional fees", debit: "25000.00" },
      { accountCode: "2100", accountName: "Due to ManCo", credit: "25000.00", counterpartyEntityId: "manco_nb" },
    ],
  });
  postJournal({
    entityId: "manco_nb",
    date: "2026-08-01",
    effectiveDate: "2026-08-01",
    memo: "Intercompany receivable for legal allocation",
    sourceType: "intercompany",
    sourceId: "exp_seed_1_manco",
    currency: "USD",
    lines: [
      { accountCode: "1300", accountName: "Due from Fund II", debit: "25000.00", counterpartyEntityId: "fund_nb_ii" },
      { accountCode: "4100", accountName: "Allocation recovery", credit: "25000.00" },
    ],
  });
}

function seedKpisValuations(db: ReturnType<typeof getDb>) {
  db.insert(schema.kpiDefinitions)
    .values([
      { id: "kpi_arr", companyId: "co_lumenforge", name: "ARR", kind: "quantitative", cadence: "quarterly", unit: "USD" },
      { id: "kpi_gm", companyId: "co_lumenforge", name: "Gross margin", kind: "quantitative", cadence: "quarterly", unit: "ratio" },
    ])
    .run();
  db.insert(schema.kpiValues)
    .values([
      { id: "kv_arr_25q4", definitionId: "kpi_arr", period: "2025-12", value: "18000000", qualitative: null, status: "accepted", provenance: "company_submission", acceptedAt: stamp("2026-01-15") },
      { id: "kv_gm_25q4", definitionId: "kpi_gm", period: "2025-12", value: "0.78", qualitative: null, status: "accepted", provenance: "manual", acceptedAt: stamp("2026-01-15") },
    ])
    .run();
  db.insert(schema.kpiRequests)
    .values({ id: "kreq_lumen_q2", companyId: "co_lumenforge", period: "2026-06", autoApprove: false, token: "sub_lumenforge_q2_demo", status: "pending_review", createdAt: stamp("2026-07-01") })
    .run();
  db.insert(schema.kpiSubmissions)
    .values({ id: "ksub_arr", requestId: "kreq_lumen_q2", definitionId: "kpi_arr", proposedValue: "21000000", priorValue: "18000000", status: "pending_review", submittedAt: stamp("2026-07-08"), reviewedAt: null })
    .run();
  db.insert(schema.collectionRequests)
    .values({ id: "col_lumen", companyId: "co_lumenforge", period: "2026-06", currency: "USD", cadence: "quarterly", token: "collect_lumen_q2", status: "submitted", createdAt: stamp("2026-07-01") })
    .run();
  db.insert(schema.collectionAnswers)
    .values([
      { id: "ans_1", requestId: "col_lumen", question: "ARR", value: "21000000", sourceLine: "P&L!B12", status: "submitted" },
      { id: "ans_2", requestId: "col_lumen", question: "Cash", value: "14000000", sourceLine: "BS!C8", status: "submitted" },
    ])
    .run();
  const draftId = saveDraftValuation({
    companyId: "co_lumenforge",
    fundId: "fund_nb_ii",
    asOfDate: "2026-06-30",
    methodsJson: JSON.stringify([
      { method: "post_money", weight: "0.5", postMoney: "140000000" },
      { method: "public_comps", weight: "0.3", metric: "18000000", comps: [{ name: "Peer A", multiple: "8", weight: "1" }], netDebt: "-4000000" },
      { method: "dcf", weight: "0.2", cashFlows: ["5000000", "6500000", "8000000"], discountRate: "0.12", terminalGrowth: "0.03" },
    ]),
  });
  postValuation(draftId);
  saveDraftValuation({
    companyId: "co_harborline",
    fundId: "fund_nb_ii",
    asOfDate: "2026-06-30",
    methodsJson: JSON.stringify([{ method: "post_money", weight: "1", postMoney: "48000000" }]),
  });
}

function seedOpsModules(db: ReturnType<typeof getDb>) {
  db.insert(schema.waterfallModels)
    .values({
      id: "wf_helios",
      firmId: "firm_northbridge",
      name: "Helios exit structure",
      nodesJson: JSON.stringify([
        { id: "co", name: "Helios target co", kind: "company" },
        { id: "spv", name: "Helios SPV I", kind: "holding", preferredAmount: "12000000" },
        { id: "fund", name: "Northbridge Ventures II", kind: "fund" },
        { id: "gp", name: "Northbridge GP", kind: "gp" },
        { id: "lp", name: "LP bucket", kind: "lp" },
      ]),
      edgesJson: JSON.stringify([
        { fromId: "co", toId: "spv", ownership: "1" },
        { fromId: "spv", toId: "fund", ownership: "1" },
        { fromId: "fund", toId: "lp", ownership: "0.80" },
        { fromId: "fund", toId: "gp", ownership: "0.20" },
      ]),
      lastRunJson: null,
      lastRunInputHash: null,
      stale: true,
      updatedAt: stamp(T),
    })
    .run();
  db.insert(schema.gpCarryUnits)
    .values([
      { id: "carry_alex", gpEntityId: "gp_nb", memberName: "Alex Chen", units: "40", vestingStart: "2024-01-01", vestingMonths: 48, cliffMonths: 12 },
      { id: "carry_morgan", gpEntityId: "gp_nb", memberName: "Morgan Vale", units: "25", vestingStart: "2024-01-01", vestingMonths: 48, cliffMonths: 12 },
    ])
    .run();
  db.insert(schema.distributions)
    .values({ id: "dst_blocked", fundId: "fund_nb_ii", waterfallRunId: "wf_helios", amount: "2000000", status: "blocked_missing_bank", requestedAt: stamp("2026-09-01"), approvedAt: null, memo: "Seed blocked distribution" })
    .run();
  db.insert(schema.distributionPayments)
    .values([
      { id: "pay_atlantic", distributionId: "dst_blocked", investorId: "lp_atlantic", amount: "294117.65", bankConfirmed: true, status: "authorized", simulatedPaymentRef: null, journalId: null },
      { id: "pay_meridian", distributionId: "dst_blocked", investorId: "lp_meridian", amount: "176470.59", bankConfirmed: false, status: "missing_bank_details", simulatedPaymentRef: null, journalId: null },
    ])
    .run();
  db.insert(schema.expenses)
    .values({ id: "exp_legal", entityId: "manco_nb", vendor: "Quill & Hale LLP", amount: "40000", currency: "USD", date: "2026-08-01", category: "legal", source: "ramp_fixture", receiptDocumentId: "doc_receipt" })
    .run();
  db.insert(schema.taxYears)
    .values({ id: "tax_ii_25", entityId: "fund_nb_ii", year: 2025, status: "client_review", estimateDocumentId: "doc_k1_est", finalDocumentId: null })
    .run();
  db.insert(schema.taxTasks)
    .values([
      { id: "tt_1", taxYearId: "tax_ii_25", title: "Missing foreign kicker questionnaire", status: "open", kind: "missing_info" },
      { id: "tt_2", taxYearId: "tax_ii_25", title: "Simulated CPA review", status: "complete", kind: "professional_review" },
    ])
    .run();
  db.insert(schema.auditEngagements)
    .values({ id: "aud_ii_25", entityId: "fund_nb_ii", year: 2025, status: "fieldwork" })
    .run();
  db.insert(schema.auditEvidence)
    .values({ id: "ae_1", engagementId: "aud_ii_25", category: "investments", documentId: "doc_soi", relatedType: "investment", relatedId: "inv_lumen_ii", status: "received" })
    .run();
  db.insert(schema.kycCases)
    .values([
      { id: "kyc_atlantic", investorId: "lp_atlantic", status: "cleared", screeningResult: "no_match", reviewerNotes: "Synthetic clear result", flagged: false, reportJson: JSON.stringify({ sample: true, vendor: "fixture" }), updatedAt: stamp(T) },
      { id: "kyc_ember", investorId: "lp_ember", status: "flagged_review", screeningResult: "potential_match", reviewerNotes: "Fixture flag for review — not an accusation", flagged: true, reportJson: JSON.stringify({ sample: true, vendor: "fixture" }), updatedAt: stamp(T) },
    ])
    .run();
  db.insert(schema.spvFormations)
    .values({
      id: "form_helios",
      entityId: "spv_helios",
      status: "banking_pending",
      checklistJson: JSON.stringify([
        { id: "name", label: "Name reservation", status: "complete", simulated: true },
        { id: "form", label: "Formation filing", status: "complete", simulated: true },
        { id: "ein", label: "EIN application", status: "complete", simulated: true },
        { id: "bank", label: "Bank account", status: "in_progress", simulated: true },
        { id: "close", label: "Initial close", status: "not_started", simulated: false },
      ]),
      updatedAt: stamp(T),
    })
    .run();
  db.insert(schema.allocatorHoldings)
    .values([
      { id: "ah_1", allocatorFirm: "Polaris Allocator", managerName: "Northbridge", vehicleName: "Northbridge Ventures II", commitment: "15000000", paidIn: "1500000", distributions: "0", residual: "1800000", vintage: 2024, strategy: "venture" },
      { id: "ah_2", allocatorFirm: "Polaris Allocator", managerName: "Cedar Peak", vehicleName: "Cedar Peak Fund IV", commitment: "20000000", paidIn: "8000000", distributions: "1200000", residual: "9000000", vintage: 2021, strategy: "venture" },
      { id: "ah_3", allocatorFirm: "Polaris Allocator", managerName: "Redwood Credit", vehicleName: "Redwood Direct Lending", commitment: "10000000", paidIn: "10000000", distributions: "2500000", residual: "8200000", vintage: 2022, strategy: "private_credit" },
    ])
    .run();
  db.insert(schema.loans)
    .values([
      { id: "loan_volt", firmId: "firm_northbridge", name: "VoltGrid delayed draw", borrower: "VoltGrid Inc.", principal: "8000000", outstanding: "5000000", annualRate: "0.11", dayCount: "ACT/365F", startDate: "2025-06-01", status: "current", pik: false },
      { id: "loan_sable", firmId: "firm_northbridge", name: "Sable revolver", borrower: "Sable Logistics Inc.", principal: "3000000", outstanding: "1200000", annualRate: "0.09", dayCount: "ACT/365F", startDate: "2024-11-01", status: "current", pik: false },
      { id: "loan_keel", firmId: "firm_northbridge", name: "Keel leftover facility", borrower: "Keel Payments Inc.", principal: "2000000", outstanding: "0", annualRate: "0.10", dayCount: "ACT/365F", startDate: "2023-01-01", status: "repaid", pik: false },
    ])
    .run();
  db.insert(schema.loanEvents)
    .values([
      { id: "le_1", loanId: "loan_volt", kind: "draw", date: "2025-06-01", amount: "5000000", note: "Initial draw" },
      { id: "le_2", loanId: "loan_sable", kind: "draw", date: "2024-11-01", amount: "1200000", note: "Revolver draw" },
      { id: "le_3", loanId: "loan_keel", kind: "repayment", date: "2025-11-15", amount: "2000000", note: "Repaid at exit" },
    ])
    .run();
  db.insert(schema.savedQueries)
    .values({ id: "q_calls", firmId: "firm_northbridge", name: "Called vs received", dataset: "capital_activities", filtersJson: JSON.stringify({ kind: "capital_call" }), groupBy: "status", aggregate: "sum_amount", createdAt: stamp(T) })
    .run();
  db.insert(schema.formulas)
    .values({ id: "f_arr_growth", fundId: "fund_nb_ii", name: "ARR growth", expression: "(arr - arr_prior) / arr_prior", variablesJson: JSON.stringify([{ name: "arr", periodOffset: 0 }, { name: "arr_prior", periodOffset: -12 }]), outputType: "ratio", updatedAt: stamp(T) })
    .run();
  db.insert(schema.publishedSnapshots)
    .values({ id: "pub_stale", fundId: "fund_nb_ii", token: "pub_nb_ii_reader_demo", payloadJson: JSON.stringify({ asOf: "2026-03-31", stale: true }), investorId: "lp_atlantic", revokedAt: null, createdAt: stamp("2026-04-01") })
    .run();
  db.insert(schema.collaborators)
    .values({ id: "col_1", fundId: "fund_nb_ii", email: "guest.editor@example.com", permission: "read", section: "forecasting", status: "invited" })
    .run();
  db.insert(schema.integrationBatches)
    .values({ id: "ib_1", firmId: "firm_northbridge", kind: "investment_events", status: "pending_review", source: "captable_fixture", createdAt: stamp(T) })
    .run();
  db.insert(schema.integrationRecords)
    .values({ id: "ir_1", batchId: "ib_1", sourceRecordId: "cap_lumen_2026q2", payloadJson: JSON.stringify({ company: "Lumenforge", amount: "1000000", date: "2026-05-01" }), decision: "pending", targetId: "inv_lumen_ii" })
    .run();
  db.insert(schema.outboxMessages)
    .values({ id: "mail_1", kind: "capital_call_notice", toAddress: "lp.atlantic@investors.example", subject: "Simulated capital call notice", body: "This is a local outbox message. No email was sent.", status: "simulated_queued", simulated: true, createdAt: stamp("2025-03-01") })
    .run();
}

function seedDocuments() {
  const dir = path.join(process.cwd(), "uploads/private");
  fs.mkdirSync(dir, { recursive: true });
  const files = [
    ["doc_receipt.txt", "Synthetic Ramp receipt fixture. Not a live Ramp connection."],
    ["doc_soi.txt", "Synthetic schedule of investments excerpt for Northbridge Ventures II."],
    ["doc_k1_est.txt", "SAMPLE TAX ESTIMATE — not a valid filing. Watermark: SAMPLE."],
    ["doc_ic_lumen.txt", "Synthetic IC memo for Lumenforge. Independent prototype."],
  ];
  const db = getDb();
  for (const [file, body] of files) {
    fs.writeFileSync(path.join(dir, file), body);
  }
  db.insert(schema.documents)
    .values([
      { id: "doc_receipt", firmId: "firm_northbridge", name: "Ramp receipt (fixture)", category: "expense", mimeType: "text/plain", storagePath: "doc_receipt.txt", relatedType: "expense", relatedId: "exp_legal", watermark: null, createdAt: stamp(T) },
      { id: "doc_soi", firmId: "firm_northbridge", name: "SOI excerpt", category: "investments", mimeType: "text/plain", storagePath: "doc_soi.txt", relatedType: "fund", relatedId: "fund_nb_ii", watermark: null, createdAt: stamp(T) },
      { id: "doc_k1_est", firmId: "firm_northbridge", name: "2025 tax estimate (sample)", category: "tax", mimeType: "text/plain", storagePath: "doc_k1_est.txt", relatedType: "tax_year", relatedId: "tax_ii_25", watermark: "SAMPLE — not a valid filing", createdAt: stamp(T) },
      { id: "doc_ic_lumen", firmId: "firm_northbridge", name: "Lumenforge IC memo", category: "deal", mimeType: "text/plain", storagePath: "doc_ic_lumen.txt", relatedType: "company", relatedId: "co_lumenforge", watermark: null, createdAt: stamp(T) },
    ])
    .run();
}
