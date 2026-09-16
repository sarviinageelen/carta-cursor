import { describe, expect, it } from "vitest";
import { computeLpMetrics } from "../metrics";

describe("computeLpMetrics", () => {
  it("matches the brief's matched-basis fixture (paid 10, dist 3, residual 12)", () => {
    const result = computeLpMetrics({
      paidIn: 10,
      distributions: 3,
      residualValue: 12,
    });
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.value.dpi.toFixed(2)).toBe("0.30");
    expect(result.value.rvpi.toFixed(2)).toBe("1.20");
    expect(result.value.tvpi.toFixed(2)).toBe("1.50");
    // TVPI must equal DPI + RVPI exactly.
    expect(result.value.tvpi.equals(result.value.dpi.plus(result.value.rvpi))).toBe(
      true,
    );
  });

  it("returns an unavailable result when paid-in is zero", () => {
    const result = computeLpMetrics({
      paidIn: 0,
      distributions: 5,
      residualValue: 5,
    });
    expect(result.available).toBe(false);
    if (result.available) return;
    expect(result.reason).toMatch(/paid-in/i);
  });

  it("uses exact decimal arithmetic without float drift", () => {
    const result = computeLpMetrics({
      paidIn: "0.3",
      distributions: "0.1",
      residualValue: "0.2",
    });
    expect(result.available).toBe(true);
    if (!result.available) return;
    // 0.1/0.3 + 0.2/0.3 must equal exactly 1.0 for TVPI.
    expect(result.value.tvpi.toFixed(4)).toBe("1.0000");
  });
});
