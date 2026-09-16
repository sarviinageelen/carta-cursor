import { eq } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { allocateByWeights, dec } from "@/domain/money";
import { getDb, schema } from "@/server/db";
import { nowIso } from "@/server/clock";
import { postJournal } from "@/server/services/accounting";

export function requestDistribution(input: { fundId: string; amount: string; memo: string }) {
  const db = getDb();
  const commitments = db
    .select()
    .from(schema.commitments)
    .where(eq(schema.commitments.fundId, input.fundId))
    .all()
    .filter((row) => row.status === "closed");
  if (!commitments.length) throw new Error("No closed commitments");
  const parts = allocateByWeights(
    input.amount,
    commitments.map((row) => row.amount),
  );
  const id = createId("dst");
  db.insert(schema.distributions)
    .values({
      id,
      fundId: input.fundId,
      waterfallRunId: null,
      amount: input.amount,
      status: "requested",
      requestedAt: nowIso(),
      approvedAt: null,
      memo: input.memo,
    })
    .run();
  commitments.forEach((commitment, index) => {
    const investor = db.select().from(schema.investors).where(eq(schema.investors.id, commitment.investorId)).get();
    db.insert(schema.distributionPayments)
      .values({
        id: createId("pay"),
        distributionId: id,
        investorId: commitment.investorId,
        amount: parts[index],
        bankConfirmed: investor?.bankDetailsConfirmed ?? false,
        status: investor?.bankDetailsConfirmed ? "authorized" : "missing_bank_details",
        simulatedPaymentRef: null,
        journalId: null,
      })
      .run();
  });
  return id;
}

export function simulateApproveAndPay(distributionId: string) {
  const db = getDb();
  const dist = db.select().from(schema.distributions).where(eq(schema.distributions.id, distributionId)).get();
  if (!dist) throw new Error("Distribution not found");
  const payments = db
    .select()
    .from(schema.distributionPayments)
    .where(eq(schema.distributionPayments.distributionId, distributionId))
    .all();
  const blocked = payments.filter((row) => !row.bankConfirmed);
  if (blocked.length) {
    db.update(schema.distributions)
      .set({ status: "blocked_missing_bank" })
      .where(eq(schema.distributions.id, distributionId))
      .run();
    return { status: "blocked_missing_bank", blocked };
  }
  const fund = db.select().from(schema.legalEntities).where(eq(schema.legalEntities.id, dist.fundId)).get();
  db.update(schema.distributions)
    .set({ status: "simulated_paid", approvedAt: nowIso() })
    .where(eq(schema.distributions.id, distributionId))
    .run();
  for (const payment of payments) {
    if (payment.simulatedPaymentRef) continue;
    const ref = `SIM-${payment.id.slice(-8).toUpperCase()}`;
    const journal = postJournal({
      entityId: dist.fundId,
      date: nowIso().slice(0, 10),
      effectiveDate: nowIso().slice(0, 10),
      memo: `Simulated distribution payment ${ref}`,
      sourceType: "simulated_distribution",
      sourceId: payment.id,
      currency: fund?.currency ?? "USD",
      lines: [
        { accountCode: "3300", accountName: "Distributions", debit: payment.amount },
        { accountCode: "1000", accountName: "Cash", credit: payment.amount },
      ],
    });
    db.update(schema.distributionPayments)
      .set({
        status: "simulated_paid",
        simulatedPaymentRef: ref,
        journalId: journal?.id ?? null,
      })
      .where(eq(schema.distributionPayments.id, payment.id))
      .run();
  }
  return { status: "simulated_paid" };
}

export function confirmBankDetails(investorId: string) {
  getDb()
    .update(schema.investors)
    .set({ bankDetailsConfirmed: true, bankAccountLast4: "9912" })
    .where(eq(schema.investors.id, investorId))
    .run();
  const payments = getDb()
    .select()
    .from(schema.distributionPayments)
    .where(eq(schema.distributionPayments.investorId, investorId))
    .all()
    .filter((row) => row.status === "missing_bank_details");
  for (const payment of payments) {
    getDb()
      .update(schema.distributionPayments)
      .set({ bankConfirmed: true, status: "authorized" })
      .where(eq(schema.distributionPayments.id, payment.id))
      .run();
  }
}

export function retryDistribution(distributionId: string) {
  return simulateApproveAndPay(distributionId);
}

export { dec };
