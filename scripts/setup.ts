import { migrate } from "../src/server/db/migrate";
import { seed } from "../src/server/db/seed";

migrate();
const result = seed();
console.log(result.seeded ? "Database seeded." : "Database already seeded.");
