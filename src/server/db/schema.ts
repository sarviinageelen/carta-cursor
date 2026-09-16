import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const firms = sqliteTable("firms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  legalName: text("legal_name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const legalEntities = sqliteTable(
  "legal_entities",
  {
    id: text("id").primaryKey(),
    firmId: text("firm_id")
      .notNull()
      .references(() => firms.id),
    name: text("name").notNull(),
    legalName: text("legal_name").notNull(),
    kind: text("kind").notNull(),
    currency: text("currency").notNull(),
    parentEntityId: text("parent_entity_id"),
    inceptionDate: text("inception_date"),
    endDate: text("end_date"),
    strategyTemplate: text("strategy_template"),
    vehicleStructure: text("vehicle_structure"),
    evergreen: integer("evergreen", { mode: "boolean" }).notNull().default(false),
    noConstruction: integer("no_construction", { mode: "boolean" }).notNull().default(false),
    commitments: text("commitments").notNull().default("0"),
    gpCommitment: text("gp_commitment").notNull().default("0"),
    callCadence: text("call_cadence"),
    status: text("status").notNull().default("active"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("legal_entities_firm_idx").on(table.firmId)],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  persona: text("persona").notNull(),
  firmId: text("firm_id").references(() => firms.id),
  investorId: text("investor_id"),
  companyId: text("company_id"),
  createdAt: text("created_at").notNull(),
});

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    firmId: text("firm_id")
      .notNull()
      .references(() => firms.id),
    role: text("role").notNull(),
    entityScopeJson: text("entity_scope_json"),
  },
  (table) => [index("memberships_user_idx").on(table.userId)],
);

export const disclosurePolicies = sqliteTable("disclosure_policies", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  cutoffDate: text("cutoff_date"),
  hideOtherLpReturns: integer("hide_other_lp_returns", { mode: "boolean" }).notNull().default(true),
  visibleTabsJson: text("visible_tabs_json").notNull(),
});

export const demoSettings = sqliteTable("demo_settings", {
  id: text("id").primaryKey(),
  demoClock: text("demo_clock").notNull(),
  warehouseRefreshedAt: text("warehouse_refreshed_at").notNull(),
});

export const companies = sqliteTable(
  "companies",
  {
    id: text("id").primaryKey(),
    firmId: text("firm_id")
      .notNull()
      .references(() => firms.id),
    name: text("name").notNull(),
    legalName: text("legal_name").notNull(),
    sector: text("sector"),
    stage: text("stage"),
    website: text("website"),
    country: text("country"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("companies_firm_idx").on(table.firmId)],
);

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  companyId: text("company_id").references(() => companies.id),
  investorId: text("investor_id"),
  name: text("name").notNull(),
  email: text("email"),
  title: text("title"),
  createdAt: text("created_at").notNull(),
});

export const investors = sqliteTable("investors", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  legalName: text("legal_name").notNull(),
  type: text("type").notNull(),
  country: text("country"),
  relationshipOwnerId: text("relationship_owner_id"),
  fundraisingStage: text("fundraising_stage"),
  bankDetailsConfirmed: integer("bank_details_confirmed", { mode: "boolean" }).notNull().default(false),
  bankAccountLast4: text("bank_account_last4"),
  disclosurePolicyId: text("disclosure_policy_id"),
  kycStatus: text("kyc_status").notNull().default("not_started"),
  createdAt: text("created_at").notNull(),
});

export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  stage: text("stage").notNull(),
  source: text("source"),
  adviser: text("adviser"),
  ownerId: text("owner_id"),
  amount: text("amount"),
  currency: text("currency").notNull().default("USD"),
  nextStep: text("next_step"),
  createdAt: text("created_at").notNull(),
});

export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  companyId: text("company_id"),
  investorId: text("investor_id"),
  dealId: text("deal_id"),
  kind: text("kind").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  occurredAt: text("occurred_at").notNull(),
  sourceProvenance: text("source_provenance").notNull().default("manual"),
});

export const constructionConfigs = sqliteTable("construction_configs", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  version: integer("version").notNull().default(1),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  inceptionDate: text("inception_date").notNull(),
  endDate: text("end_date"),
  commitments: text("commitments").notNull(),
  gpCommitment: text("gp_commitment").notNull(),
  callCadence: text("call_cadence"),
  vehicleStructure: text("vehicle_structure"),
  evergreen: integer("evergreen", { mode: "boolean" }).notNull().default(false),
  noConstruction: integer("no_construction", { mode: "boolean" }).notNull().default(false),
  forecastHorizonMonths: integer("forecast_horizon_months").notNull().default(120),
  status: text("status").notNull().default("draft"),
  updatedAt: text("updated_at").notNull(),
});

export const sectorProfiles = sqliteTable("sector_profiles", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const sectorStages = sqliteTable("sector_stages", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => sectorProfiles.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
  graduation: text("graduation").notNull(),
  exit: text("exit").notNull(),
  monthsToNext: integer("months_to_next").notNull(),
  monthsToExit: integer("months_to_exit").notNull(),
  roundSize: text("round_size").notNull(),
  preMoney: text("pre_money").notNull(),
  postMoney: text("post_money").notNull(),
  optionPoolDilution: text("option_pool_dilution").notNull(),
  exitValue: text("exit_value").notNull(),
  followOnCheck: text("follow_on_check").notNull().default("0"),
});

export const allocations = sqliteTable("allocations", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  profileId: text("profile_id")
    .notNull()
    .references(() => sectorProfiles.id),
  name: text("name").notNull(),
  entryStageId: text("entry_stage_id").notNull(),
  budget: text("budget").notNull(),
  initialCheck: text("initial_check").notNull(),
  initialOwnership: text("initial_ownership").notNull(),
  followOnAmount: text("follow_on_amount").notNull(),
  followOnOwnership: text("follow_on_ownership").notNull(),
  followOnParticipation: integer("follow_on_participation", { mode: "boolean" }).notNull().default(true),
  horizonMonths: integer("horizon_months").notNull(),
});

export const feeProfiles = sqliteTable("fee_profiles", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  name: text("name").notNull(),
});

export const feeTiers = sqliteTable("fee_tiers", {
  id: text("id").primaryKey(),
  feeProfileId: text("fee_profile_id")
    .notNull()
    .references(() => feeProfiles.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  rate: text("rate").notNull(),
  basis: text("basis").notNull(),
  feeRecycling: integer("fee_recycling", { mode: "boolean" }).notNull().default(false),
});

export const expenseSchedules = sqliteTable("expense_schedules", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  name: text("name").notNull(),
  monthlyAmount: text("monthly_amount").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
});

export const recyclingPolicies = sqliteTable("recycling_policies", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  recyclablePct: text("recyclable_pct").notNull(),
  capVsCommitments: text("cap_vs_commitments").notNull(),
  termMonths: integer("term_months").notNull(),
  useAnticipatedProceeds: integer("use_anticipated_proceeds", { mode: "boolean" }).notNull().default(false),
  feeRecyclingCap: text("fee_recycling_cap").notNull().default("0"),
});

export const fundWaterfallConfigs = sqliteTable("fund_waterfall_configs", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  structure: text("structure").notNull(),
  preferredRate: text("preferred_rate").notNull(),
  catchUp: integer("catch_up", { mode: "boolean" }).notNull().default(true),
  carryRate: text("carry_rate").notNull(),
  profile: text("profile").notNull(),
});

export const modeledLps = sqliteTable("modeled_lps", {
  id: text("id").primaryKey(),
  constructionId: text("construction_id")
    .notNull()
    .references(() => constructionConfigs.id),
  name: text("name").notNull(),
  commitment: text("commitment").notNull(),
  feeProfileId: text("fee_profile_id"),
  customSplitJson: text("custom_split_json"),
  investorId: text("investor_id"),
});

export const investments = sqliteTable(
  "investments",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id")
      .notNull()
      .references(() => legalEntities.id),
    companyId: text("company_id").references(() => companies.id),
    portfolioFundId: text("portfolio_fund_id"),
    name: text("name").notNull(),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    entryStageId: text("entry_stage_id"),
    profileId: text("profile_id"),
    fofSourceForecast: text("fof_source_forecast"),
    fofAmount: text("fof_amount"),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("investments_fund_idx").on(table.fundId)],
);

export const investmentCases = sqliteTable("investment_cases", {
  id: text("id").primaryKey(),
  investmentId: text("investment_id")
    .notNull()
    .references(() => investments.id),
  name: text("name").notNull(),
  probability: text("probability").notNull(),
  isBase: integer("is_base", { mode: "boolean" }).notNull().default(false),
  clonedFromId: text("cloned_from_id"),
});

export const investmentEvents = sqliteTable("investment_events", {
  id: text("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => investmentCases.id),
  kind: text("kind").notNull(),
  date: text("date").notNull(),
  amount: text("amount").notNull().default("0"),
  ownership: text("ownership"),
  preMoney: text("pre_money"),
  postMoney: text("post_money"),
  roundCurrency: text("round_currency"),
  fxRate: text("fx_rate"),
  fxRateDate: text("fx_rate_date"),
  securityType: text("security_type"),
  valuationCap: text("valuation_cap"),
  convertedOwnership: text("converted_ownership"),
  isProjected: integer("is_projected", { mode: "boolean" }).notNull().default(false),
  sourceProvenance: text("source_provenance").notNull().default("manual"),
  sourceRecordId: text("source_record_id"),
  notes: text("notes"),
});

export const investmentLiqPrefs = sqliteTable("investment_liq_prefs", {
  id: text("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => investmentCases.id),
  name: text("name").notNull(),
  seniority: integer("seniority").notNull(),
  type: text("type").notNull(),
  preferenceAmount: text("preference_amount").notNull(),
  participationCap: text("participation_cap"),
  fullyDilutedOwnership: text("fully_diluted_ownership").notNull(),
});

export const fundScenarios = sqliteTable("fund_scenarios", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  overridesJson: text("overrides_json").notNull(),
  resultJson: text("result_json"),
  inputVersion: integer("input_version").notNull(),
  calculatedInputVersion: integer("calculated_input_version"),
  stale: integer("stale", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const monthlyActualOverrides = sqliteTable(
  "monthly_actual_overrides",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id")
      .notNull()
      .references(() => legalEntities.id),
    month: text("month").notNull(),
    field: text("field").notNull(),
    amount: text("amount").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("monthly_actuals_unique").on(table.fundId, table.month, table.field)],
);

export const savedViews = sqliteTable("saved_views", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  userId: text("user_id"),
  name: text("name").notNull(),
  surface: text("surface").notNull(),
  columnsJson: text("columns_json").notNull(),
  filtersJson: text("filters_json"),
});

export const kpiDefinitions = sqliteTable("kpi_definitions", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  cadence: text("cadence").notNull(),
  unit: text("unit"),
});

export const kpiValues = sqliteTable("kpi_values", {
  id: text("id").primaryKey(),
  definitionId: text("definition_id")
    .notNull()
    .references(() => kpiDefinitions.id),
  period: text("period").notNull(),
  value: text("value"),
  qualitative: text("qualitative"),
  status: text("status").notNull(),
  provenance: text("provenance").notNull(),
  acceptedAt: text("accepted_at"),
});

export const kpiRequests = sqliteTable("kpi_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  period: text("period").notNull(),
  autoApprove: integer("auto_approve", { mode: "boolean" }).notNull().default(false),
  token: text("token").notNull().unique(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const kpiSubmissions = sqliteTable("kpi_submissions", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => kpiRequests.id),
  definitionId: text("definition_id")
    .notNull()
    .references(() => kpiDefinitions.id),
  proposedValue: text("proposed_value"),
  priorValue: text("prior_value"),
  status: text("status").notNull(),
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
});

export const formulas = sqliteTable("formulas", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  name: text("name").notNull(),
  expression: text("expression").notNull(),
  variablesJson: text("variables_json").notNull(),
  outputType: text("output_type").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  watermark: text("watermark"),
  createdAt: text("created_at").notNull(),
});

export const publishedSnapshots = sqliteTable("published_snapshots", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  token: text("token").notNull().unique(),
  payloadJson: text("payload_json").notNull(),
  investorId: text("investor_id"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
});

export const collaborators = sqliteTable("collaborators", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  email: text("email").notNull(),
  permission: text("permission").notNull(),
  section: text("section").notNull(),
  status: text("status").notNull(),
});

export const multiFundViews = sqliteTable("multi_fund_views", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  fundIdsJson: text("fund_ids_json").notNull(),
  currency: text("currency").notNull(),
});

export const integrationBatches = sqliteTable("integration_batches", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  createdAt: text("created_at").notNull(),
});

export const integrationRecords = sqliteTable("integration_records", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => integrationBatches.id),
  sourceRecordId: text("source_record_id").notNull(),
  payloadJson: text("payload_json").notNull(),
  decision: text("decision").notNull().default("pending"),
  targetId: text("target_id"),
});

export const commitments = sqliteTable("commitments", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  closingId: text("closing_id"),
  createdAt: text("created_at").notNull(),
});

export const closings = sqliteTable("closings", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  status: text("status").notNull(),
  targetAmount: text("target_amount"),
  softCommitment: text("soft_commitment"),
  legalCommitment: text("legal_commitment"),
  questionnaireStatus: text("questionnaire_status"),
  signatureSimulatedAt: text("signature_simulated_at"),
  countersignedAt: text("countersigned_at"),
  createdAt: text("created_at").notNull(),
});

export const capitalActivities = sqliteTable("capital_activities", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  amount: text("amount").notNull(),
  noticeDate: text("notice_date").notNull(),
  effectiveDate: text("effective_date").notNull(),
  dueDate: text("due_date").notNull(),
  memo: text("memo"),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const capitalAllocations = sqliteTable("capital_allocations", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => capitalActivities.id),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  amount: text("amount").notNull(),
  receivedAmount: text("received_amount").notNull().default("0"),
});

export const cashReceipts = sqliteTable("cash_receipts", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => capitalActivities.id),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  amount: text("amount").notNull(),
  receivedDate: text("received_date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  date: text("date").notNull(),
  effectiveDate: text("effective_date").notNull(),
  memo: text("memo").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  status: text("status").notNull(),
  reversalOfId: text("reversal_of_id"),
  currency: text("currency").notNull(),
  createdAt: text("created_at").notNull(),
});

export const journalLines = sqliteTable("journal_lines", {
  id: text("id").primaryKey(),
  entryId: text("entry_id")
    .notNull()
    .references(() => journalEntries.id),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  debit: text("debit").notNull().default("0"),
  credit: text("credit").notNull().default("0"),
  currency: text("currency").notNull(),
  counterpartyEntityId: text("counterparty_entity_id"),
});

export const valuations = sqliteTable("valuations", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  fundId: text("fund_id").references(() => legalEntities.id),
  asOfDate: text("as_of_date").notNull(),
  status: text("status").notNull(),
  methodsJson: text("methods_json").notNull(),
  equityValue: text("equity_value"),
  fundNavImpact: text("fund_nav_impact"),
  postedJournalId: text("posted_journal_id"),
  postedAt: text("posted_at"),
  version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const collectionRequests = sqliteTable("collection_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  period: text("period").notNull(),
  currency: text("currency").notNull(),
  cadence: text("cadence").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const collectionAnswers = sqliteTable("collection_answers", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .references(() => collectionRequests.id),
  question: text("question").notNull(),
  value: text("value"),
  sourceLine: text("source_line"),
  status: text("status").notNull(),
});

export const waterfallModels = sqliteTable("waterfall_models", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  nodesJson: text("nodes_json").notNull(),
  edgesJson: text("edges_json").notNull(),
  lastRunJson: text("last_run_json"),
  lastRunInputHash: text("last_run_input_hash"),
  stale: integer("stale", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull(),
});

export const gpCarryUnits = sqliteTable("gp_carry_units", {
  id: text("id").primaryKey(),
  gpEntityId: text("gp_entity_id")
    .notNull()
    .references(() => legalEntities.id),
  memberName: text("member_name").notNull(),
  units: text("units").notNull(),
  vestingStart: text("vesting_start").notNull(),
  vestingMonths: integer("vesting_months").notNull(),
  cliffMonths: integer("cliff_months").notNull().default(0),
});

export const distributions = sqliteTable("distributions", {
  id: text("id").primaryKey(),
  fundId: text("fund_id")
    .notNull()
    .references(() => legalEntities.id),
  waterfallRunId: text("waterfall_run_id"),
  amount: text("amount").notNull(),
  status: text("status").notNull(),
  requestedAt: text("requested_at").notNull(),
  approvedAt: text("approved_at"),
  memo: text("memo"),
});

export const distributionPayments = sqliteTable("distribution_payments", {
  id: text("id").primaryKey(),
  distributionId: text("distribution_id")
    .notNull()
    .references(() => distributions.id),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  amount: text("amount").notNull(),
  bankConfirmed: integer("bank_confirmed", { mode: "boolean" }).notNull(),
  status: text("status").notNull(),
  simulatedPaymentRef: text("simulated_payment_ref"),
  journalId: text("journal_id"),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  vendor: text("vendor").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  source: text("source").notNull(),
  receiptDocumentId: text("receipt_document_id"),
});

export const expenseAllocations = sqliteTable("expense_allocations", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id")
    .notNull()
    .references(() => expenses.id),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  amount: text("amount").notNull(),
  journalId: text("journal_id"),
});

export const taxYears = sqliteTable("tax_years", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  year: integer("year").notNull(),
  status: text("status").notNull(),
  estimateDocumentId: text("estimate_document_id"),
  finalDocumentId: text("final_document_id"),
});

export const taxTasks = sqliteTable("tax_tasks", {
  id: text("id").primaryKey(),
  taxYearId: text("tax_year_id")
    .notNull()
    .references(() => taxYears.id),
  title: text("title").notNull(),
  status: text("status").notNull(),
  kind: text("kind").notNull(),
});

export const auditEngagements = sqliteTable("audit_engagements", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  year: integer("year").notNull(),
  status: text("status").notNull(),
});

export const auditEvidence = sqliteTable("audit_evidence", {
  id: text("id").primaryKey(),
  engagementId: text("engagement_id")
    .notNull()
    .references(() => auditEngagements.id),
  category: text("category").notNull(),
  documentId: text("document_id"),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  status: text("status").notNull(),
});

export const kycCases = sqliteTable("kyc_cases", {
  id: text("id").primaryKey(),
  investorId: text("investor_id")
    .notNull()
    .references(() => investors.id),
  status: text("status").notNull(),
  screeningResult: text("screening_result"),
  reviewerNotes: text("reviewer_notes"),
  flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
  reportJson: text("report_json"),
  updatedAt: text("updated_at").notNull(),
});

export const spvFormations = sqliteTable("spv_formations", {
  id: text("id").primaryKey(),
  entityId: text("entity_id")
    .notNull()
    .references(() => legalEntities.id),
  status: text("status").notNull(),
  checklistJson: text("checklist_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const allocatorHoldings = sqliteTable("allocator_holdings", {
  id: text("id").primaryKey(),
  allocatorFirm: text("allocator_firm").notNull(),
  managerName: text("manager_name").notNull(),
  vehicleName: text("vehicle_name").notNull(),
  commitment: text("commitment").notNull(),
  paidIn: text("paid_in").notNull(),
  distributions: text("distributions").notNull(),
  residual: text("residual").notNull(),
  vintage: integer("vintage").notNull(),
  strategy: text("strategy").notNull(),
});

export const loans = sqliteTable("loans", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  borrower: text("borrower").notNull(),
  principal: text("principal").notNull(),
  outstanding: text("outstanding").notNull(),
  annualRate: text("annual_rate").notNull(),
  dayCount: text("day_count").notNull(),
  startDate: text("start_date").notNull(),
  status: text("status").notNull(),
  pik: integer("pik", { mode: "boolean" }).notNull().default(false),
});

export const loanEvents = sqliteTable("loan_events", {
  id: text("id").primaryKey(),
  loanId: text("loan_id")
    .notNull()
    .references(() => loans.id),
  kind: text("kind").notNull(),
  date: text("date").notNull(),
  amount: text("amount").notNull(),
  note: text("note"),
});

export const savedQueries = sqliteTable("saved_queries", {
  id: text("id").primaryKey(),
  firmId: text("firm_id")
    .notNull()
    .references(() => firms.id),
  name: text("name").notNull(),
  dataset: text("dataset").notNull(),
  filtersJson: text("filters_json").notNull(),
  groupBy: text("group_by"),
  aggregate: text("aggregate").notNull(),
  createdAt: text("created_at").notNull(),
});

export const outboxMessages = sqliteTable("outbox_messages", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull(),
  simulated: integer("simulated", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  firmId: text("firm_id"),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  detailsJson: text("details_json"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});
