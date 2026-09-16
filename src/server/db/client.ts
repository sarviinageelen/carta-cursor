import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { DATA_DIR, DB_FILE } from "./paths";

// A single shared connection per Node process. Next.js dev mode reloads modules,
// so we cache the connection on globalThis to avoid opening many handles.
const globalForDb = globalThis as unknown as {
  __cartaSqlite?: Database.Database;
};

function createConnection(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_FILE);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export const sqlite = globalForDb.__cartaSqlite ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__cartaSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
