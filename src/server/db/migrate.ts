import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./client";

// Idempotent: Drizzle tracks applied migrations in __drizzle_migrations and
// skips ones already applied, so this is safe to run on every install.
function run() {
  const migrationsFolder = path.join(process.cwd(), "src/server/db/migrations");
  migrate(db, { migrationsFolder });
  sqlite.close();
  console.log("[db:migrate] migrations applied.");
}

run();
