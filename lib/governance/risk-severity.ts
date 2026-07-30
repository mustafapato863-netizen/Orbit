import type { RiskLevel } from "@/generated/prisma/client";

export function deriveRiskSeverity(probability: number, impact: number): RiskLevel {
  const score = probability * impact;
  if (score >= 17) return "CRITICAL";
  if (score >= 10) return "HIGH";
  if (score >= 5) return "MEDIUM";
  return "LOW";
}
