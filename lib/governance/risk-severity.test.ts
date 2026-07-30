import { describe, expect, it } from "vitest";
import { deriveRiskSeverity } from "@/lib/governance/risk-severity";

describe("deriveRiskSeverity", () => {
  it.each([
    [1, 4, "LOW"],
    [1, 5, "MEDIUM"],
    [2, 5, "HIGH"],
    [4, 4, "HIGH"],
    [4, 5, "CRITICAL"],
  ] as const)("maps probability %i and impact %i to %s", (probability, impact, expected) => {
    expect(deriveRiskSeverity(probability, impact)).toBe(expected);
  });
});
