import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import { createId } from "@/lib/ids";
import { nowIso } from "@/server/clock";

export type Persona =
  | "investment_editor"
  | "fund_ops"
  | "investor_relations"
  | "lp"
  | "company_submitter"
  | "auditor"
  | "borrower";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  persona: Persona;
  firmId: string | null;
  investorId: string | null;
  companyId: string | null;
};

const COOKIE = "fund_erp_session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const sessionId = store.get(COOKIE)?.value;
  if (!sessionId) return null;
  const db = getDb();
  const session = db.select().from(schema.sessions).where(eq(schema.sessions.id, sessionId)).get();
  if (!session) return null;
  const user = db.select().from(schema.users).where(eq(schema.users.id, session.userId)).get();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    persona: user.persona as Persona,
    firmId: user.firmId,
    investorId: user.investorId,
    companyId: user.companyId,
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function createSession(userId: string) {
  const db = getDb();
  const id = createId("ses");
  db.insert(schema.sessions)
    .values({
      id,
      userId,
      createdAt: nowIso(),
      expiresAt: "2030-01-01T00:00:00.000Z",
    })
    .run();
  const store = await cookies();
  store.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  return id;
}

export async function clearSession() {
  const store = await cookies();
  const sessionId = store.get(COOKIE)?.value;
  if (sessionId) {
    getDb().delete(schema.sessions).where(eq(schema.sessions.id, sessionId)).run();
  }
  store.delete(COOKIE);
}

export function assertFirm(session: SessionUser, firmId: string) {
  if (session.firmId !== firmId) {
    throw new Error("Forbidden");
  }
}

export function canReadModule(session: SessionUser, module: string) {
  if (session.persona === "lp") return module === "lp" || module === "published";
  if (session.persona === "company_submitter") return module === "submit" || module === "data-collection";
  if (session.persona === "auditor") return module === "audit" || module === "home" || module === "documents";
  if (session.persona === "borrower") return module === "loans";
  return true;
}

export function canMutate(session: SessionUser, action: string) {
  if (session.persona === "auditor" || session.persona === "lp" || session.persona === "borrower") {
    return false;
  }
  if (action === "post_valuation" || action === "issue_call" || action === "post_journal") {
    return session.persona === "fund_ops";
  }
  if (action === "countersign") return session.persona === "fund_ops" || session.persona === "investor_relations";
  return true;
}

export function lpMaySeeDate(session: SessionUser, asOf: string, cutoff: string | null) {
  if (session.persona !== "lp") return true;
  if (!cutoff) return true;
  return asOf <= cutoff;
}

export function getMembership(userId: string, firmId: string) {
  return getDb()
    .select()
    .from(schema.memberships)
    .where(and(eq(schema.memberships.userId, userId), eq(schema.memberships.firmId, firmId)))
    .get();
}
