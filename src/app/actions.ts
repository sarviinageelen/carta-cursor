"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { getDb, schema } from "@/server/db";
import { clearSession, createSession, requireSession } from "@/server/auth/session";
import { nowIso, setDemoClock, today } from "@/server/clock";
import { validateStageProbabilities } from "@/domain/probabilities";
import { issueCapitalCall, recordReceipt } from "@/server/services/capital";
import { saveDraftValuation, postValuation } from "@/server/services/valuations";
import { acceptSubmission, createKpiRequest, rejectSubmission, submitKpi } from "@/server/services/kpis";
import { confirmBankDetails, requestDistribution, retryDistribution, simulateApproveAndPay } from "@/server/services/distributions";
import { cloneCase, persistInvestmentDraft, recalculateScenario, saveScenario } from "@/server/services/scenarios";
import { runWaterfallModel, markWaterfallStale } from "@/server/services/analytics";
import { postJournal } from "@/server/services/accounting";

export async function switchPersona(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = getDb().select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("Unknown demo persona");
  await clearSession();
  await createSession(user.id);
  if (user.persona === "lp") redirect("/lp");
  if (user.persona === "company_submitter") redirect("/data-collection");
  if (user.persona === "auditor") redirect("/audit");
  redirect("/home");
}

export async function loginAction(formData: FormData) {
  return switchPersona(formData);
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function saveConstructionSection(formData: FormData) {
  await requireSession();
  const constructionId = String(formData.get("constructionId"));
  const fundId = String(formData.get("fundId"));
  getDb()
    .update(schema.constructionConfigs)
    .set({
      name: String(formData.get("name") ?? "Construction"),
      commitments: String(formData.get("commitments") ?? "0"),
      gpCommitment: String(formData.get("gpCommitment") ?? "0"),
      evergreen: formData.get("evergreen") === "on",
      noConstruction: formData.get("noConstruction") === "on",
      updatedAt: nowIso(),
    })
    .where(eq(schema.constructionConfigs.id, constructionId))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveStage(formData: FormData) {
  await requireSession();
  const id = String(formData.get("stageId"));
  const fundId = String(formData.get("fundId"));
  const graduation = String(formData.get("graduation"));
  const exit = String(formData.get("exit"));
  const isTerminal = formData.get("isTerminal") === "true";
  const result = validateStageProbabilities({ graduation, exit, isTerminal });
  if (result.status !== "ok") {
    throw new Error(result.message);
  }
  getDb()
    .update(schema.sectorStages)
    .set({
      graduation,
      exit,
      monthsToNext: Number(formData.get("monthsToNext") ?? 0),
      monthsToExit: Number(formData.get("monthsToExit") ?? 0),
      followOnCheck: String(formData.get("followOnCheck") ?? "0"),
      exitValue: String(formData.get("exitValue") ?? "0"),
    })
    .where(eq(schema.sectorStages.id, id))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveAllocation(formData: FormData) {
  await requireSession();
  const id = String(formData.get("allocationId"));
  const fundId = String(formData.get("fundId"));
  getDb()
    .update(schema.allocations)
    .set({
      budget: String(formData.get("budget")),
      initialCheck: String(formData.get("initialCheck")),
      initialOwnership: String(formData.get("initialOwnership")),
      followOnParticipation: formData.get("followOnParticipation") === "on",
      horizonMonths: Number(formData.get("horizonMonths") ?? 36),
    })
    .where(eq(schema.allocations.id, id))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveMonthlyOverride(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  const month = String(formData.get("month"));
  const amount = String(formData.get("amount"));
  const existing = getDb()
    .select()
    .from(schema.monthlyActualOverrides)
    .where(eq(schema.monthlyActualOverrides.fundId, fundId))
    .all()
    .find((row) => row.month === month && row.field === "expenses");
  if (existing) {
    getDb()
      .update(schema.monthlyActualOverrides)
      .set({ amount, updatedAt: nowIso() })
      .where(eq(schema.monthlyActualOverrides.id, existing.id))
      .run();
  } else {
    getDb()
      .insert(schema.monthlyActualOverrides)
      .values({ id: createId("ov"), fundId, month, field: "expenses", amount, updatedAt: nowIso() })
      .run();
  }
  revalidatePath(`/funds/${fundId}/forecasting`);
}

export async function saveInvestmentAction(formData: FormData) {
  await requireSession();
  const investmentId = String(formData.get("investmentId"));
  const caseId = String(formData.get("caseId"));
  const fundId = String(formData.get("fundId"));
  const version = Number(formData.get("version"));
  const raw = JSON.parse(String(formData.get("eventsJson") ?? "[]")) as Array<{
    id?: string;
    kind: string;
    date: string;
    amount: string;
    ownership?: string | null;
    isProjected?: boolean;
    notes?: string | null;
    postMoney?: string | null;
    preMoney?: string | null;
  }>;
  persistInvestmentDraft({ investmentId, caseId, version, events: raw });
  revalidatePath(`/funds/${fundId}/forecasting/investments/${investmentId}`);
}

export async function createInvestmentAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  const name = String(formData.get("name"));
  const companyId = String(formData.get("companyId"));
  const date = String(formData.get("date"));
  const amount = String(formData.get("amount"));
  const fund = getDb().select().from(schema.legalEntities).where(eq(schema.legalEntities.id, fundId)).get();
  if (fund?.inceptionDate && date < fund.inceptionDate) {
    throw new Error("First investment date cannot precede fund inception.");
  }
  const id = createId("inv");
  const caseId = createId("case");
  getDb()
    .insert(schema.investments)
    .values({
      id,
      fundId,
      companyId,
      portfolioFundId: null,
      name,
      status: date > today() ? "planned" : "unrealized",
      currency: fund?.currency ?? "USD",
      entryStageId: null,
      profileId: null,
      fofSourceForecast: null,
      fofAmount: null,
      version: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .run();
  getDb()
    .insert(schema.investmentCases)
    .values({ id: caseId, investmentId: id, name: "Base", probability: "1", isBase: true, clonedFromId: null })
    .run();
  getDb()
    .insert(schema.investmentEvents)
    .values({
      id: createId("ev"),
      caseId,
      kind: "financing",
      date,
      amount,
      ownership: String(formData.get("ownership") || "0.10"),
      preMoney: null,
      postMoney: null,
      roundCurrency: fund?.currency ?? "USD",
      fxRate: "1",
      fxRateDate: date,
      securityType: "preferred",
      valuationCap: null,
      convertedOwnership: null,
      isProjected: date > today(),
      sourceProvenance: "manual",
      sourceRecordId: null,
      notes: "Created in prototype",
    })
    .run();
  getDb()
    .insert(schema.investmentEvents)
    .values({
      id: createId("ev"),
      caseId,
      kind: "exit",
      date: String(formData.get("exitDate") || "2030-01-01"),
      amount: String(formData.get("exitAmount") || "0"),
      ownership: null,
      preMoney: null,
      postMoney: null,
      roundCurrency: fund?.currency ?? "USD",
      fxRate: "1",
      fxRateDate: String(formData.get("exitDate") || "2030-01-01"),
      securityType: "preferred",
      valuationCap: null,
      convertedOwnership: null,
      isProjected: true,
      sourceProvenance: "manual",
      sourceRecordId: null,
      notes: "Projected exit",
    })
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/investments`);
  redirect(`/funds/${fundId}/forecasting/investments/${id}`);
}

export async function recalculateScenarioAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("scenarioId"));
  const fundId = String(formData.get("fundId"));
  recalculateScenario(id, today());
  revalidatePath(`/funds/${fundId}/forecasting/scenarios`);
}

export async function saveScenarioAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  saveScenario({
    fundId,
    name: String(formData.get("name")),
    overrides: {
      note: String(formData.get("note") ?? ""),
      followOnBoost: String(formData.get("followOnBoost") || "0"),
      exitHaircut: String(formData.get("exitHaircut") || "0"),
      remainingMultiplier: String(formData.get("remainingMultiplier") || "1"),
      exitDelayMonths: Number(formData.get("exitDelayMonths") || 0),
    },
  });
  revalidatePath(`/funds/${fundId}/forecasting/scenarios`);
}

export async function saveRecyclingAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  getDb()
    .update(schema.recyclingPolicies)
    .set({
      recyclablePct: String(formData.get("recyclablePct")),
      capVsCommitments: String(formData.get("capVsCommitments")),
      termMonths: Number(formData.get("termMonths") ?? 0),
      feeRecyclingCap: String(formData.get("feeRecyclingCap") ?? "0"),
      useAnticipatedProceeds: formData.get("useAnticipatedProceeds") === "on",
    })
    .where(eq(schema.recyclingPolicies.id, String(formData.get("recyclingId"))))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveWaterfallConfigAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  const structure = String(formData.get("structure"));
  if (structure !== "european") {
    throw new Error("American/deal-by-deal waterfall is unsupported. Keep european_whole_fund_v1.");
  }
  getDb()
    .update(schema.fundWaterfallConfigs)
    .set({
      structure,
      preferredRate: String(formData.get("preferredRate")),
      catchUp: formData.get("catchUp") === "on",
      carryRate: String(formData.get("carryRate")),
      profile: "fund_waterfall_european_v1",
    })
    .where(eq(schema.fundWaterfallConfigs.id, String(formData.get("waterfallId"))))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveModeledLpAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  getDb()
    .update(schema.modeledLps)
    .set({
      name: String(formData.get("name")),
      commitment: String(formData.get("commitment")),
    })
    .where(eq(schema.modeledLps.id, String(formData.get("modeledLpId"))))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function saveFeeTierAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  getDb()
    .update(schema.feeTiers)
    .set({
      rate: String(formData.get("rate")),
      basis: String(formData.get("basis")),
      feeRecycling: formData.get("feeRecycling") === "on",
    })
    .where(eq(schema.feeTiers.id, String(formData.get("tierId"))))
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/construction`);
}

export async function cloneCaseAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  const investmentId = String(formData.get("investmentId"));
  cloneCase(String(formData.get("caseId")), String(formData.get("name") || "Cloned case"));
  revalidatePath(`/funds/${fundId}/forecasting/investments/${investmentId}`);
}

export async function advanceSpvStepAction(formData: FormData) {
  await requireSession();
  const formation = getDb()
    .select()
    .from(schema.spvFormations)
    .where(eq(schema.spvFormations.id, String(formData.get("formationId"))))
    .get();
  if (!formation) throw new Error("Formation not found");
  const items = JSON.parse(formation.checklistJson) as Array<{ id: string; label: string; status: string; simulated: boolean }>;
  const next = items.find((item) => item.status !== "complete");
  if (next) next.status = "complete";
  const done = items.every((item) => item.status === "complete");
  getDb()
    .update(schema.spvFormations)
    .set({
      checklistJson: JSON.stringify(items),
      status: done ? "simulated_complete" : "in_progress",
      updatedAt: nowIso(),
    })
    .where(eq(schema.spvFormations.id, formation.id))
    .run();
  revalidatePath("/spvs");
}

export async function createFundAction(formData: FormData) {
  await requireSession();
  const name = String(formData.get("name"));
  const template = String(formData.get("template"));
  const id = createId("fund");
  getDb()
    .insert(schema.legalEntities)
    .values({
      id,
      firmId: "firm_northbridge",
      name,
      legalName: `${name} LP`,
      kind: template === "spv_no_construction" ? "spv" : "fund",
      currency: "USD",
      parentEntityId: "gp_nb",
      inceptionDate: today(),
      endDate: template === "evergreen" ? null : "2036-12-31",
      strategyTemplate: template,
      vehicleStructure: template === "spv_no_construction" ? "llc" : "lp",
      evergreen: template === "evergreen",
      noConstruction: template === "spv_no_construction",
      commitments: String(formData.get("commitments") || "50000000"),
      gpCommitment: "1000000",
      callCadence: "quarterly",
      status: "active",
      version: 1,
      createdAt: nowIso(),
    })
    .run();
  const cfg = createId("cfg");
  getDb()
    .insert(schema.constructionConfigs)
    .values({
      id: cfg,
      fundId: id,
      version: 1,
      name: "Construction",
      currency: "USD",
      inceptionDate: today(),
      endDate: template === "evergreen" ? null : "2036-12-31",
      commitments: String(formData.get("commitments") || "50000000"),
      gpCommitment: "1000000",
      callCadence: "quarterly",
      vehicleStructure: "lp",
      evergreen: template === "evergreen",
      noConstruction: template === "spv_no_construction",
      forecastHorizonMonths: 120,
      status: "draft",
      updatedAt: nowIso(),
    })
    .run();
  redirect(`/funds/${id}/forecasting/construction`);
}

export async function issueCallAction(formData: FormData) {
  const session = await requireSession();
  if (session.persona !== "fund_ops") throw new Error("Fund operations persona required to issue a call.");
  const fundId = String(formData.get("fundId"));
  issueCapitalCall({
    fundId,
    amount: String(formData.get("amount")),
    noticeDate: today(),
    effectiveDate: String(formData.get("effectiveDate") || today()),
    dueDate: String(formData.get("dueDate") || today()),
    memo: String(formData.get("memo") || "Capital call"),
  });
  revalidatePath(`/funds/${fundId}/operations/calls`);
}

export async function recordReceiptAction(formData: FormData) {
  await requireSession();
  recordReceipt({
    activityId: String(formData.get("activityId")),
    investorId: String(formData.get("investorId")),
    amount: String(formData.get("amount")),
    receivedDate: String(formData.get("receivedDate") || today()),
  });
  revalidatePath("/funds");
}

export async function advanceClosingAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("closingId"));
  const next = String(formData.get("nextStatus"));
  const patch: Record<string, string | null> = { status: next };
  if (next === "signed") patch.signatureSimulatedAt = nowIso();
  if (next === "countersigned") {
    patch.countersignedAt = nowIso();
    const closing = getDb().select().from(schema.closings).where(eq(schema.closings.id, id)).get();
    if (closing) {
      getDb()
        .insert(schema.commitments)
        .values({
          id: createId("cmt"),
          fundId: closing.fundId,
          investorId: closing.investorId,
          amount: closing.targetAmount ?? "0",
          currency: "USD",
          status: "closed",
          closingId: closing.id,
          createdAt: nowIso(),
        })
        .run();
    }
  }
  getDb().update(schema.closings).set(patch).where(eq(schema.closings.id, id)).run();
  revalidatePath("/fundraising");
}

export async function createKpiRequestAction(formData: FormData) {
  await requireSession();
  createKpiRequest({
    companyId: String(formData.get("companyId")),
    period: String(formData.get("period")),
    autoApprove: formData.get("autoApprove") === "on",
    definitionIds: [],
  });
  revalidatePath("/data-collection");
}

export async function submitKpiAction(formData: FormData) {
  submitKpi({
    token: String(formData.get("token")),
    definitionId: String(formData.get("definitionId")),
    proposedValue: String(formData.get("proposedValue")),
  });
  revalidatePath("/data-collection");
}

export async function reviewKpiAction(formData: FormData) {
  await requireSession();
  const decision = String(formData.get("decision"));
  const id = String(formData.get("submissionId"));
  if (decision === "accept") acceptSubmission(id);
  else rejectSubmission(id);
  revalidatePath("/data-collection");
}

export async function saveValuationAction(formData: FormData) {
  await requireSession();
  saveDraftValuation({
    id: String(formData.get("valuationId") || "") || undefined,
    companyId: String(formData.get("companyId")),
    fundId: String(formData.get("fundId")),
    asOfDate: String(formData.get("asOfDate")),
    methodsJson: String(formData.get("methodsJson")),
  });
  revalidatePath("/valuations");
}

export async function postValuationAction(formData: FormData) {
  const session = await requireSession();
  if (session.persona !== "fund_ops") throw new Error("Only fund operations can post valuations.");
  postValuation(String(formData.get("valuationId")));
  revalidatePath("/valuations");
  revalidatePath("/home");
}

export async function runWaterfallAction(formData: FormData) {
  await requireSession();
  runWaterfallModel(String(formData.get("modelId")), String(formData.get("exitValue")), String(formData.get("exitDate") || today()));
  revalidatePath("/waterfalls");
}

export async function changeWaterfallInputsAction(formData: FormData) {
  await requireSession();
  markWaterfallStale(String(formData.get("modelId")));
  revalidatePath("/waterfalls");
}

export async function requestDistributionAction(formData: FormData) {
  await requireSession();
  requestDistribution({
    fundId: String(formData.get("fundId")),
    amount: String(formData.get("amount")),
    memo: String(formData.get("memo") || "Distribution request"),
  });
  revalidatePath(`/funds/${String(formData.get("fundId"))}/operations/distributions`);
}

export async function payDistributionAction(formData: FormData) {
  await requireSession();
  simulateApproveAndPay(String(formData.get("distributionId")));
  revalidatePath("/funds");
}

export async function confirmBankAction(formData: FormData) {
  await requireSession();
  confirmBankDetails(String(formData.get("investorId")));
  retryDistribution(String(formData.get("distributionId")));
  revalidatePath("/funds");
}

export async function setClockAction(formData: FormData) {
  await requireSession();
  setDemoClock(String(formData.get("demoClock")));
  revalidatePath("/");
}

export async function createDealAction(formData: FormData) {
  await requireSession();
  getDb()
    .insert(schema.deals)
    .values({
      id: createId("deal"),
      firmId: "firm_northbridge",
      companyId: String(formData.get("companyId")),
      name: String(formData.get("name")),
      stage: String(formData.get("stage") || "watch"),
      source: "manual",
      adviser: null,
      ownerId: "user_alex",
      amount: String(formData.get("amount") || "0"),
      currency: "USD",
      nextStep: String(formData.get("nextStep") || ""),
      createdAt: nowIso(),
    })
    .run();
  revalidatePath("/crm/deals");
}

export async function updateDealStageAction(formData: FormData) {
  await requireSession();
  getDb()
    .update(schema.deals)
    .set({ stage: String(formData.get("stage")) })
    .where(eq(schema.deals.id, String(formData.get("dealId"))))
    .run();
  revalidatePath("/crm/deals");
}

export async function acceptIntegrationAction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("recordId"));
  const keepLocal = formData.get("keepLocal") === "on";
  getDb()
    .update(schema.integrationRecords)
    .set({ decision: keepLocal ? "accepted_keep_local" : "accepted_replace" })
    .where(eq(schema.integrationRecords.id, id))
    .run();
  revalidatePath("/integrations");
}

export async function publishSnapshotAction(formData: FormData) {
  await requireSession();
  const fundId = String(formData.get("fundId"));
  const token = `pub_${createId("tok")}`;
  getDb()
    .insert(schema.publishedSnapshots)
    .values({
      id: createId("pub"),
      fundId,
      token,
      payloadJson: JSON.stringify({ asOf: today(), immutable: true }),
      investorId: String(formData.get("investorId") || "") || null,
      revokedAt: null,
      createdAt: nowIso(),
    })
    .run();
  revalidatePath(`/funds/${fundId}/forecasting/sharing`);
}

export async function revokeSnapshotAction(formData: FormData) {
  await requireSession();
  getDb()
    .update(schema.publishedSnapshots)
    .set({ revokedAt: nowIso() })
    .where(eq(schema.publishedSnapshots.id, String(formData.get("snapshotId"))))
    .run();
  revalidatePath("/");
}

export async function inviteCollaboratorAction(formData: FormData) {
  await requireSession();
  const permission = String(formData.get("permission") || "");
  if (!permission) throw new Error("Explicit permission is required; the prototype does not default to full write.");
  getDb()
    .insert(schema.collaborators)
    .values({
      id: createId("col"),
      fundId: String(formData.get("fundId")),
      email: String(formData.get("email")),
      permission,
      section: String(formData.get("section") || "forecasting"),
      status: "invited",
    })
    .run();
  getDb()
    .insert(schema.outboxMessages)
    .values({
      id: createId("mail"),
      kind: "collaborator_invite",
      toAddress: String(formData.get("email")),
      subject: "Simulated collaborator invitation",
      body: "Local outbox only. No email was sent.",
      status: "simulated_queued",
      simulated: true,
      createdAt: nowIso(),
    })
    .run();
  revalidatePath("/");
}

export async function createMultiFundViewAction(formData: FormData) {
  await requireSession();
  const ids = String(formData.get("fundIds") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const funds = ids.map((id) => getDb().select().from(schema.legalEntities).where(eq(schema.legalEntities.id, id)).get());
  const currencies = [...new Set(funds.map((fund) => fund?.currency).filter(Boolean))];
  if (currencies.length !== 1) {
    throw new Error("Multi-fund views require a common currency.");
  }
  getDb()
    .insert(schema.multiFundViews)
    .values({
      id: createId("mfv"),
      firmId: "firm_northbridge",
      name: String(formData.get("name")),
      fundIdsJson: JSON.stringify(ids),
      currency: String(currencies[0]),
    })
    .run();
  revalidatePath("/home");
}

export async function allocateExpenseAction(formData: FormData) {
  await requireSession();
  const amount = String(formData.get("amount"));
  const fundId = String(formData.get("fundId"));
  postJournal({
    entityId: fundId,
    date: today(),
    effectiveDate: today(),
    memo: "ManCo allocation",
    sourceType: "manco_allocation",
    sourceId: createId("alc"),
    currency: "USD",
    lines: [
      { accountCode: "5100", accountName: "Allocated expense", debit: amount },
      { accountCode: "2100", accountName: "Due to ManCo", credit: amount, counterpartyEntityId: "manco_nb" },
    ],
  });
  postJournal({
    entityId: "manco_nb",
    date: today(),
    effectiveDate: today(),
    memo: "ManCo allocation receivable",
    sourceType: "manco_allocation_ar",
    sourceId: createId("alc"),
    currency: "USD",
    lines: [
      { accountCode: "1300", accountName: "Due from fund", debit: amount, counterpartyEntityId: fundId },
      { accountCode: "4100", accountName: "Allocation recovery", credit: amount },
    ],
  });
  revalidatePath("/management-company");
}
