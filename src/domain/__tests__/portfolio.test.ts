import { describe, expect, it } from "vitest";
import { derivePosition, deriveFundSummary } from "../portfolio";

describe("derivePosition", () => {
  it("uses the most recent valuation mark for active positions", () => {
    const pos = derivePosition("active", [
      { kind: "invest", amount: "1000000", eventDate: "2023-01-01" },
      { kind: "valuation", amount: "1500000", eventDate: "2023-06-01" },
      { kind: "valuation", amount: "2200000", eventDate: "2024-06-01" },
    ]);
    expect(pos.invested.toFixed()).toBe("1000000");
    expect(pos.residualValue.toFixed()).toBe("2200000");
    expect(pos.distributions.toFixed()).toBe("0");
  });

  it("carries zero residual for written-off positions even with a stale mark", () => {
    const pos = derivePosition("written_off", [
      { kind: "invest", amount: "500000", eventDate: "2022-01-01" },
      { kind: "valuation", amount: "400000", eventDate: "2022-06-01" },
    ]);
    expect(pos.residualValue.toFixed()).toBe("0");
    expect(pos.invested.toFixed()).toBe("500000");
  });

  it("sums distributions for realized positions", () => {
    const pos = derivePosition("realized", [
      { kind: "invest", amount: "300000", eventDate: "2020-01-01" },
      { kind: "distribution", amount: "450000", eventDate: "2023-01-01" },
      { kind: "distribution", amount: "150000", eventDate: "2023-09-01" },
    ]);
    expect(pos.distributions.toFixed()).toBe("600000");
    expect(pos.residualValue.toFixed()).toBe("0");
  });
});

describe("deriveFundSummary", () => {
  it("aggregates positions and derives LP multiples on paid-in", () => {
    const summary = deriveFundSummary([
      {
        status: "active",
        events: [
          { kind: "invest", amount: "1000000", eventDate: "2023-01-01" },
          { kind: "valuation", amount: "2000000", eventDate: "2024-06-01" },
        ],
      },
      {
        status: "realized",
        events: [
          { kind: "invest", amount: "1000000", eventDate: "2021-01-01" },
          { kind: "distribution", amount: "3000000", eventDate: "2024-01-01" },
        ],
      },
    ]);
    expect(summary.paidIn.toFixed()).toBe("2000000");
    expect(summary.distributions.toFixed()).toBe("3000000");
    expect(summary.residualValue.toFixed()).toBe("2000000");
    expect(summary.activeCount).toBe(1);
    expect(summary.realizedCount).toBe(1);
    expect(summary.metrics.available).toBe(true);
    if (!summary.metrics.available) return;
    // DPI = 3.0M/2.0M = 1.5, RVPI = 2.0M/2.0M = 1.0, TVPI = 2.5
    expect(summary.metrics.value.dpi.toFixed(2)).toBe("1.50");
    expect(summary.metrics.value.rvpi.toFixed(2)).toBe("1.00");
    expect(summary.metrics.value.tvpi.toFixed(2)).toBe("2.50");
  });
});
