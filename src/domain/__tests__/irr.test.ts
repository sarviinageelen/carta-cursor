import { describe, expect, it } from "vitest";
import { computeIrr } from "../irr";

describe("computeIrr (ACT/365F)", () => {
  it("returns 10% for -100 on 2025-01-01 and +110 on 2026-01-01", () => {
    const result = computeIrr([
      { date: "2025-01-01", amount: -100 },
      { date: "2026-01-01", amount: 110 },
    ]);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.rate).toBeCloseTo(0.1, 6);
    expect(result.warnings).toHaveLength(0);
  });

  it("reports no sign change when all flows share a sign", () => {
    const result = computeIrr([
      { date: "2025-01-01", amount: -100 },
      { date: "2026-01-01", amount: -10 },
    ]);
    expect(result.status).toBe("no_sign_change");
  });

  it("warns on multiple sign changes rather than asserting a unique root", () => {
    const result = computeIrr([
      { date: "2025-01-01", amount: -100 },
      { date: "2025-07-01", amount: 230 },
      { date: "2026-01-01", amount: -132 },
    ]);
    if (result.status === "ok") {
      expect(result.warnings.length).toBeGreaterThan(0);
    } else {
      expect(["no_solution", "non_converged"]).toContain(result.status);
    }
  });

  it("returns a typed empty result for no cash flows", () => {
    const result = computeIrr([]);
    expect(result.status).toBe("no_cashflows");
  });
});
