import { and, eq } from "drizzle-orm";
import { createId, createToken } from "@/lib/ids";
import { getDb, schema } from "@/server/db";
import { nowIso } from "@/server/clock";

export function createKpiRequest(input: { companyId: string; period: string; autoApprove: boolean; definitionIds: string[] }) {
  const db = getDb();
  const id = createId("kreq");
  const token = createToken();
  db.insert(schema.kpiRequests)
    .values({
      id,
      companyId: input.companyId,
      period: input.period,
      autoApprove: input.autoApprove,
      token,
      status: "pending_update",
      createdAt: nowIso(),
    })
    .run();
  return { id, token };
}

export function submitKpi(input: { token: string; definitionId: string; proposedValue: string }) {
  const db = getDb();
  const request = db.select().from(schema.kpiRequests).where(eq(schema.kpiRequests.token, input.token)).get();
  if (!request) throw new Error("Request not found");
  const accepted = db
    .select()
    .from(schema.kpiValues)
    .where(and(eq(schema.kpiValues.definitionId, input.definitionId), eq(schema.kpiValues.status, "accepted")))
    .all()
    .filter((row) => row.period === request.period)[0];
  const submissionId = createId("ksub");
  const status = request.autoApprove ? "accepted" : "pending_review";
  db.insert(schema.kpiSubmissions)
    .values({
      id: submissionId,
      requestId: request.id,
      definitionId: input.definitionId,
      proposedValue: input.proposedValue,
      priorValue: accepted?.value ?? null,
      status,
      submittedAt: nowIso(),
      reviewedAt: request.autoApprove ? nowIso() : null,
    })
    .run();
  db.update(schema.kpiRequests)
    .set({ status: request.autoApprove ? "accepted" : "pending_review" })
    .where(eq(schema.kpiRequests.id, request.id))
    .run();
  if (request.autoApprove) {
    acceptSubmission(submissionId);
  }
  return submissionId;
}

export function acceptSubmission(submissionId: string) {
  const db = getDb();
  const submission = db.select().from(schema.kpiSubmissions).where(eq(schema.kpiSubmissions.id, submissionId)).get();
  if (!submission) throw new Error("Submission not found");
  const request = db.select().from(schema.kpiRequests).where(eq(schema.kpiRequests.id, submission.requestId)).get();
  db.update(schema.kpiSubmissions)
    .set({ status: "accepted", reviewedAt: nowIso() })
    .where(eq(schema.kpiSubmissions.id, submissionId))
    .run();
  const existing = db
    .select()
    .from(schema.kpiValues)
    .where(eq(schema.kpiValues.definitionId, submission.definitionId))
    .all()
    .find((row) => row.period === request?.period && row.status === "accepted");
  if (existing) {
    db.update(schema.kpiValues)
      .set({ status: "superseded" })
      .where(eq(schema.kpiValues.id, existing.id))
      .run();
  }
  db.insert(schema.kpiValues)
    .values({
      id: createId("kval"),
      definitionId: submission.definitionId,
      period: request?.period ?? "",
      value: submission.proposedValue,
      qualitative: null,
      status: "accepted",
      provenance: "company_submission",
      acceptedAt: nowIso(),
    })
    .run();
}

export function rejectSubmission(submissionId: string) {
  const db = getDb();
  const submission = db.select().from(schema.kpiSubmissions).where(eq(schema.kpiSubmissions.id, submissionId)).get();
  if (!submission) throw new Error("Submission not found");
  db.update(schema.kpiSubmissions)
    .set({ status: "rejected", reviewedAt: nowIso() })
    .where(eq(schema.kpiSubmissions.id, submissionId))
    .run();
}
