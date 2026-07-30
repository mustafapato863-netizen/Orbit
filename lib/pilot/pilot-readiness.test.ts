import { describe, expect, it } from "vitest";
import { deriveGateStatus, derivePilotReadiness } from "@/lib/pilot/pilot-readiness";

describe("Pilot readiness", () => {
  it("derives required Entry and Exit gates without optional criteria blocking readiness", () => {
    const criteria = [
      { type: "ENTRY" as const, isRequired: true, status: "MET" as const },
      { type: "ENTRY" as const, isRequired: false, status: "NOT_STARTED" as const },
      { type: "EXIT" as const, isRequired: true, status: "NOT_MET" as const },
    ];
    expect(deriveGateStatus(criteria, "ENTRY")).toBe("READY");
    expect(deriveGateStatus(criteria, "EXIT")).toBe("BLOCKED");
  });

  it("requires owners, scope, gates, sign-offs and no open blockers for approval readiness", () => {
    const result = derivePilotReadiness({
      supportOwnerId: "support",
      rollbackOwnerId: "rollback",
      businessSignOffStatus: "APPROVED",
      technicalSignOffStatus: "APPROVED",
      criteria: [
        { type: "ENTRY", isRequired: true, status: "MET" },
        { type: "EXIT", isRequired: true, status: "WAIVED" },
      ],
      teams: [{}],
      capabilities: [{ disposition: "INCLUDED" }],
      issues: [{ isBlocking: true, status: "RESOLVED" }],
    });
    expect(result.approvalReady).toBe(true);
  });
});
