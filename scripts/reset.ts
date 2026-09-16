import fs from "node:fs";
import path from "node:path";

const confirmed = process.argv.includes("--yes");
if (!confirmed) {
  console.error("Refusing to reset. Re-run with --yes to delete this project's synthetic database and uploads.");
  process.exit(1);
}

const dbFile = path.resolve(process.env.DATABASE_PATH ?? "data/fund-erp.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${dbFile}${suffix}`;
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
const uploadDir = path.resolve("uploads/private");
if (fs.existsSync(uploadDir)) {
  for (const file of fs.readdirSync(uploadDir)) {
    fs.unlinkSync(path.join(uploadDir, file));
  }
}
console.log("Local synthetic database and uploads removed.");
