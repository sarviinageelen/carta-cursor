"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { investmentEvents, investments } from "./db/schema";
import { money, toCanonical } from "@/domain/money";

const addEventSchema = z.object({
  investmentId: z.string().min(1),
  fundId: z.string().min(1),
  kind: z.enum(["valuation", "distribution", "invest"]),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => {
      try {
        const d = money(v.replace(/,/g, ""));
        return d.isFinite() && d.greaterThanOrEqualTo(0);
      } catch {
        return false;
      }
    }, "Enter a non-negative number"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  note: z.string().max(200).optional(),
});

export interface ActionState {
  ok: boolean;
  message: string;
}

/**
 * Record a dated event (valuation mark, distribution, or capital deployment)
 * against an investment. Persisted to SQLite so it survives reload and restart.
 */
export async function addInvestmentEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addEventSchema.safeParse({
    investmentId: formData.get("investmentId"),
    fundId: formData.get("fundId"),
    kind: formData.get("kind"),
    amount: formData.get("amount"),
    eventDate: formData.get("eventDate"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Invalid input." };
  }

  const { investmentId, fundId, kind, amount, eventDate, note } = parsed.data;

  const investment = db
    .select()
    .from(investments)
    .where(eq(investments.id, investmentId))
    .get();
  if (!investment || investment.fundId !== fundId) {
    return { ok: false, message: "Investment not found in this fund." };
  }

  const canonical = toCanonical(money(amount.replace(/,/g, "")));

  db.insert(investmentEvents)
    .values({
      id: `evt_${randomUUID()}`,
      investmentId,
      kind,
      amount: canonical,
      eventDate,
      note: note ?? "",
    })
    .run();

  revalidatePath(`/funds/${fundId}`);
  revalidatePath(`/funds/${fundId}/investments/${investmentId}`);
  revalidatePath("/funds");
  revalidatePath("/home");

  const label =
    kind === "valuation"
      ? "Valuation mark"
      : kind === "distribution"
        ? "Distribution"
        : "Capital deployment";
  return { ok: true, message: `${label} recorded and persisted.` };
}
