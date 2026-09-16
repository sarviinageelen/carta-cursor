import fs from "node:fs";
import readline from "node:readline";
import { DB_FILE } from "./paths";

// Destructive: deletes only this project's synthetic SQLite database. Requires
// an explicit confirmation flag or interactive "yes". Never targets other data.
function removeDbFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${DB_FILE}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
  console.log("[db:reset] synthetic database removed. Run `npm run db:setup` to recreate.");
}

if (process.argv.includes("--yes") || process.env.CONFIRM_RESET === "yes") {
  removeDbFiles();
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(
    "This deletes the local synthetic database at .data/. Type 'yes' to confirm: ",
    (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === "yes") removeDbFiles();
      else console.log("[db:reset] aborted.");
    },
  );
}
