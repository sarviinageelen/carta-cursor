import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  drizzle?: ReturnType<typeof drizzle<typeof schema>>;
};

export function databasePath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH);
  }
  return path.join(process.cwd(), "data", "fund-erp.sqlite");
}

export function getSqlite() {
  if (!globalForDb.sqlite) {
    const file = databasePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const sqlite = new Database(file);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");
    globalForDb.sqlite = sqlite;
  }
  return globalForDb.sqlite;
}

export function getDb() {
  if (!globalForDb.drizzle) {
    globalForDb.drizzle = drizzle(getSqlite(), { schema });
  }
  return globalForDb.drizzle;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
