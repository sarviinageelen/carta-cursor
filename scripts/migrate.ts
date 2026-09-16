import { migrate } from "../src/server/db/migrate";

migrate();
console.log("Migrations applied.");
