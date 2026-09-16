import { eq } from "drizzle-orm";
import { getDb, schema } from "@/server/db";

export const DEFAULT_DEMO_CLOCK = "2026-09-16";

export function getDemoClock() {
  const db = getDb();
  const row = db.select().from(schema.demoSettings).where(eq(schema.demoSettings.id, "global")).get();
  return row?.demoClock ?? DEFAULT_DEMO_CLOCK;
}

export function setDemoClock(date: string) {
  const db = getDb();
  db.update(schema.demoSettings).set({ demoClock: date }).where(eq(schema.demoSettings.id, "global")).run();
  return date;
}

export function today() {
  return getDemoClock();
}

export function nowIso() {
  return `${today()}T12:00:00.000Z`;
}
