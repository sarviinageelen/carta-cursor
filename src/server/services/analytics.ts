import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { runEntityWaterfall } from "@/domain/waterfall-entity";
import { evaluateFormula, shiftPeriod } from "@/domain/formula";
import { europeanWholeFundWaterfall } from "@/domain/waterfall-fund";
import { getDb, schema } from "@/server/db";
import { eq } from "drizzle-orm";

export function hashPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function signToken(value: string) {
  const secret = process.env.SESSION_SECRET ?? "local-demo-only-change-me";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function verifyToken(value: string, signature: string) {
  const expected = Buffer.from(signToken(value));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function runWaterfallModel(modelId: string, exitValue: string, exitDate: string) {
  const db = getDb();
  const model = db.select().from(schema.waterfallModels).where(eq(schema.waterfallModels.id, modelId)).get();
  if (!model) throw new Error("Model not found");
  const nodes = JSON.parse(model.nodesJson);
  const edges = JSON.parse(model.edgesJson);
  const result = runEntityWaterfall({ exitEntityId: nodes[0].id, exitValue, nodes, edges });
  const inputHash = hashPayload({ exitValue, exitDate, nodes, edges });
  db.update(schema.waterfallModels)
    .set({
      lastRunJson: JSON.stringify({ exitValue, exitDate, result, profile: "entity_waterfall_ownership_pref_v1" }),
      lastRunInputHash: inputHash,
      stale: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.waterfallModels.id, modelId))
    .run();
  return result;
}

export function markWaterfallStale(modelId: string) {
  getDb()
    .update(schema.waterfallModels)
    .set({ stale: true })
    .where(eq(schema.waterfallModels.id, modelId))
    .run();
}

export function fundWaterfallPreview(input: Parameters<typeof europeanWholeFundWaterfall>[0]) {
  return europeanWholeFundWaterfall(input);
}

export function formulaForPeriod(
  expression: string,
  variables: Array<{ name: string; periodOffset: number; valueByPeriod: Record<string, string | null> }>,
  period: string,
) {
  return evaluateFormula(
    expression,
    variables.map((variable) => ({
      name: variable.name,
      value: variable.valueByPeriod[shiftPeriod(period, variable.periodOffset)] ?? null,
    })),
  );
}
