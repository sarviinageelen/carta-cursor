import type { Config } from "drizzle-kit";
import { DB_FILE } from "./src/server/db/paths";

export default {
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: DB_FILE,
  },
} satisfies Config;
