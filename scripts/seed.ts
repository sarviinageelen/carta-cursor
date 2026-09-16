import { seed } from "../src/server/db/seed";

const result = seed();
console.log(result.seeded ? "Seeded." : "Already seeded.");
