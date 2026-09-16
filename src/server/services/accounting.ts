import { and, eq } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { dec, sumAmounts } from "@/domain/money";
import { getDb, schema } from "@/server/db";
import { nowIso, today } from "@/server/clock";

export type JournalLineInput = {
  accountCode: string;
  accountName: string;
  debit?: string;
  credit?: string;
  counterpartyEntityId?: string | null;
};

export function postJournal(input: {
  entityId: string;
  date: string;
  effectiveDate: string;
  memo: string;
  sourceType: string;
  sourceId: string;
  currency: string;
  lines: JournalLineInput[];
}) {
  const db = getDb();
  const existing = db
    .select()
    .from(schema.journalEntries)
    .where(
      and(
        eq(schema.journalEntries.sourceType, input.sourceType),
        eq(schema.journalEntries.sourceId, input.sourceId),
        eq(schema.journalEntries.status, "posted"),
      ),
    )
    .get();
  if (existing) return existing;

  const debits = sumAmounts(input.lines.map((line) => line.debit ?? "0"));
  const credits = sumAmounts(input.lines.map((line) => line.credit ?? "0"));
  if (!debits.eq(credits)) {
    throw new Error(`Unbalanced journal: debits ${debits.toFixed()} credits ${credits.toFixed()}`);
  }

  const id = createId("je");
  const sqlite = db;
  sqlite.transaction((tx) => {
    tx.insert(schema.journalEntries)
      .values({
        id,
        entityId: input.entityId,
        date: input.date,
        effectiveDate: input.effectiveDate,
        memo: input.memo,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        status: "posted",
        reversalOfId: null,
        currency: input.currency,
        createdAt: nowIso(),
      })
      .run();
    for (const line of input.lines) {
      tx.insert(schema.journalLines)
        .values({
          id: createId("jl"),
          entryId: id,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.debit ?? "0.00",
          credit: line.credit ?? "0.00",
          currency: input.currency,
          counterpartyEntityId: line.counterpartyEntityId ?? null,
        })
        .run();
    }
  });
  return db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, id)).get();
}

export function reverseJournal(entryId: string) {
  const db = getDb();
  const entry = db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, entryId)).get();
  if (!entry) throw new Error("Journal not found");
  const existingReversal = db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.reversalOfId, entryId))
    .get();
  if (existingReversal) return existingReversal;
  const lines = db.select().from(schema.journalLines).where(eq(schema.journalLines.entryId, entryId)).all();
  return postJournal({
    entityId: entry.entityId,
    date: today(),
    effectiveDate: today(),
    memo: `Reversal of ${entry.id}`,
    sourceType: "reversal",
    sourceId: `rev_${entryId}`,
    currency: entry.currency,
    lines: lines.map((line) => ({
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.credit,
      credit: line.debit,
      counterpartyEntityId: line.counterpartyEntityId,
    })),
  });
}

export function balancesAsOf(entityId: string, asOf: string) {
  const db = getDb();
  const entries = db
    .select()
    .from(schema.journalEntries)
    .where(and(eq(schema.journalEntries.entityId, entityId), eq(schema.journalEntries.status, "posted")))
    .all()
    .filter((entry) => entry.effectiveDate <= asOf);
  const ids = new Set(entries.map((entry) => entry.id));
  const lines = db.select().from(schema.journalLines).all().filter((line) => ids.has(line.entryId));
  const map = new Map<string, { accountCode: string; accountName: string; debit: ReturnType<typeof dec>; credit: ReturnType<typeof dec> }>();
  for (const line of lines) {
    const current = map.get(line.accountCode) ?? {
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: dec(0),
      credit: dec(0),
    };
    current.debit = current.debit.plus(dec(line.debit));
    current.credit = current.credit.plus(dec(line.credit));
    map.set(line.accountCode, current);
  }
  return [...map.values()].map((row) => ({
    ...row,
    debit: row.debit.toFixed(2),
    credit: row.credit.toFixed(2),
    net: row.debit.minus(row.credit).toFixed(2),
  }));
}

export function accountNet(entityId: string, accountCode: string, asOf: string) {
  const row = balancesAsOf(entityId, asOf).find((item) => item.accountCode === accountCode);
  return row?.net ?? "0.00";
}

/** Credit-normal capital accounts (paid-in) as a positive amount for LP multiples. */
export function creditNormalBalance(entityId: string, accountCode: string, asOf: string) {
  const row = balancesAsOf(entityId, asOf).find((item) => item.accountCode === accountCode);
  if (!row) return "0.00";
  return dec(row.credit).minus(dec(row.debit)).toFixed(2);
}

export function assertJournalsBalance() {
  const db = getDb();
  const entries = db.select().from(schema.journalEntries).all();
  for (const entry of entries) {
    const lines = db.select().from(schema.journalLines).where(eq(schema.journalLines.entryId, entry.id)).all();
    const debit = sumAmounts(lines.map((line) => line.debit));
    const credit = sumAmounts(lines.map((line) => line.credit));
    if (!debit.eq(credit)) {
      throw new Error(`Unbalanced ${entry.id}`);
    }
  }
}
