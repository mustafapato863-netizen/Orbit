export type GateStatus = "READY" | "PENDING" | "BLOCKED";

type Criterion = {
  type: "ENTRY" | "EXIT";
  isRequired: boolean;
  status: "NOT_STARTED" | "MET" | "NOT_MET" | "WAIVED";
};

export function deriveGateStatus(
  criteria: Criterion[],
  type: "ENTRY" | "EXIT",
): GateStatus {
  const required = criteria.filter((criterion) => criterion.type === type && criterion.isRequired);
  if (!required.length) return "PENDING";
  if (required.some(({ status }) => status === "NOT_MET")) return "BLOCKED";
  if (required.every(({ status }) => status === "MET" || status === "WAIVED")) return "READY";
  return "PENDING";
}

export function derivePilotReadiness(scope: {
  supportOwnerId: string | null;
  rollbackOwnerId: string | null;
  businessSignOffStatus: "PENDING" | "APPROVED" | "REJECTED";
  technicalSignOffStatus: "PENDING" | "APPROVED" | "REJECTED";
  criteria: Criterion[];
  teams: unknown[];
  capabilities: Array<{ disposition: "INCLUDED" | "DEFERRED" }>;
  issues: Array<{ isBlocking: boolean; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" }>;
}) {
  const entryGateStatus = deriveGateStatus(scope.criteria, "ENTRY");
  const exitGateStatus = deriveGateStatus(scope.criteria, "EXIT");
  const openBlockers = scope.issues.filter(
    ({ isBlocking, status }) =>
      isBlocking && (status === "OPEN" || status === "IN_PROGRESS"),
  ).length;
  const setupReady =
    Boolean(scope.supportOwnerId) &&
    Boolean(scope.rollbackOwnerId) &&
    scope.teams.length > 0 &&
    scope.capabilities.some(({ disposition }) => disposition === "INCLUDED");
  const approvalReady =
    setupReady &&
    entryGateStatus === "READY" &&
    exitGateStatus === "READY" &&
    openBlockers === 0 &&
    scope.businessSignOffStatus === "APPROVED" &&
    scope.technicalSignOffStatus === "APPROVED";
  return {
    entryGateStatus,
    exitGateStatus,
    openBlockers,
    setupReady,
    approvalReady,
  };
}
