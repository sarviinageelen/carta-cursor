import path from "node:path";

// Project-scoped private data directory. Never served publicly.
export const DATA_DIR = path.join(process.cwd(), ".data");
export const DB_FILE = path.join(DATA_DIR, "carta-fund-erp.sqlite");
