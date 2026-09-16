import { and, eq } from "drizzle-orm";
import { allocateByWeights, dec } from "@/domain/money";
import { createId } from "@/lib/ids";
import { getDb, schema } from "@/server/db";
import { nowIso, today } from "@/server/clock";
import { postJournal } from "@/server/services/accounting";

export function issueCapitalCall(input: {
  fundId: string;
  amount: string;
  noticeDate: string;
  effectiveDate: string;
  dueDate: string;
  memo: string;
}) {
  const db = getDb();
  const fund = db.select().from(schema.legalEntities).where(eq(schema.legalEntities.id, input.fundId)).get();
  if (!fund) throw new Error("Fund not found");
  const closed = db
    .select()
    .from(schema.commitments)
    .where(and(eq(schema.commitments.fundId, input.fundId), eq(schema.commitments.status, "closed")))
    .all();
  if (closed.length === 0) throw new Error("No closed commitments");
  const parts = allocateByWeights(
    input.amount,
    closed.map((row) => row.amount),
  );
  const activityId = createId("call");
  db.transaction((tx) => {
    tx.insert(schema.capitalActivities)
      .values({
        id: activityId,
        fundId: input.fundId,
        kind: "capital_call",
        status: "issued",
        amount: input.amount,
        noticeDate: input.noticeDate,
        effectiveDate: input.effectiveDate,
        dueDate: input.dueDate,
        memo: input.memo,
        version: 1,
        createdAt: nowIso(),
      })
      .run();
    closed.forEach((commitment, index) => {
      tx.insert(schema.capitalAllocations)
        .values({
          id: createId("ca"),
          activityId,
          investorId: commitment.investorId,
          amount: parts[index],
          receivedAmount: "0.00",
        })
        .run();
    });
  });
  postJournal({
    entityId: input.fundId,
    date: input.noticeDate,
    effectiveDate: input.effectiveDate,
    memo: input.memo || "Capital call notice",
    sourceType: "capital_call",
    sourceId: activityId,
    currency: fund.currency,
    lines: [
      { accountCode: "1200", accountName: "Contributions receivable", debit: input.amount },
      { accountCode: "3100", accountName: "Called capital", credit: input.amount },
    ],
  });
  return activityId;
}

export function recordReceipt(input: { activityId: string; investorId: string; amount: string; receivedDate: string }) {
  const db = getDb();
  const activity = db
    .select()
    .from(schema.capitalActivities)
    .where(eq(schema.capitalActivities.id, input.activityId))
    .get();
  if (!activity) throw new Error("Activity not found");
  const allocation = db
    .select()
    .from(schema.capitalAllocations)
    .where(
      and(
        eq(schema.capitalAllocations.activityId, input.activityId),
        eq(schema.capitalAllocations.investorId, input.investorId),
      ),
    )
    .get();
  if (!allocation) throw new Error("Allocation not found");
  const nextReceived = dec(allocation.receivedAmount).plus(dec(input.amount));
  if (nextReceived.gt(dec(allocation.amount))) {
    throw new Error("Receipt exceeds called amount");
  }
  const receiptId = createId("rcpt");
  db.insert(schema.cashReceipts)
    .values({
      id: receiptId,
      activityId: input.activityId,
      investorId: input.investorId,
      amount: input.amount,
      receivedDate: input.receivedDate,
      createdAt: nowIso(),
    })
    .run();
  db.update(schema.capitalAllocations)
    .set({ receivedAmount: nextReceived.toFixed(2) })
    .where(eq(schema.capitalAllocations.id, allocation.id))
    .run();
  const fund = db.select().from(schema.legalEntities).where(eq(schema.legalEntities.id, activity.fundId)).get();
  postJournal({
    entityId: activity.fundId,
    date: input.receivedDate,
    effectiveDate: input.receivedDate,
    memo: "Capital call receipt",
    sourceType: "cash_receipt",
    sourceId: receiptId,
    currency: fund?.currency ?? "USD",
    lines: [
      { accountCode: "1000", accountName: "Cash", debit: input.amount },
      { accountCode: "1200", accountName: "Contributions receivable", credit: input.amount },
      { accountCode: "3200", accountName: "Paid-in capital", credit: "0.00" },
    ],
  });
  postJournal({
    entityId: activity.fundId,
    date: input.receivedDate,
    effectiveDate: input.receivedDate,
    memo: "Paid-in capital recognition",
    sourceType: "paid_in",
    sourceId: receiptId,
    currency: fund?.currency ?? "USD",
    lines: [
      { accountCode: "3100", accountName: "Called capital", debit: input.amount },
      { accountCode: "3200", accountName: "Paid-in capital", credit: input.amount },
    ],
  });
  const all = db
    .select()
    .from(schema.capitalAllocations)
    .where(eq(schema.capitalAllocations.activityId, input.activityId))
    .all();
  const fully = all.every((row) => dec(row.receivedAmount).eq(dec(row.amount)));
  const partial = all.some((row) => dec(row.receivedAmount).gt(0));
  db.update(schema.capitalActivities)
    .set({ status: fully ? "received" : partial ? "partially_received" : "issued" })
    .where(eq(schema.capitalActivities.id, input.activityId))
    .run();
  return receiptId;
}

export function callOutstanding(activityId: string) {
  const rows = getDb()
    .select()
    .from(schema.capitalAllocations)
    .where(eq(schema.capitalAllocations.activityId, activityId))
    .all();
  return rows.map((row) => ({
    ...row,
    outstanding: dec(row.amount).minus(dec(row.receivedAmount)).toFixed(2),
  }));
}

export { today };
