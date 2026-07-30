import {
  PilotCriterionType,
  PilotIssueStatus,
  RiskLevel,
} from "../generated/prisma/client";

export const PMS_PILOT_SCOPE_SEED = {
  id: "83000000-0000-4000-8000-000000000001",
  name: "PMS Controlled Pilot",
  knownLimitations:
    "AI Insights & Recommendations and advanced report composition remain outside the first Pilot scope. Pilot support is limited to agreed operating hours.",
  supportOwnerEmail: "manager@orbit.local",
  rollbackOwnerEmail: "lead@orbit.local",
} as const;

export const pmsPilotTeamSeeds = [
  {
    id: "83100000-0000-4000-8000-000000000001",
    name: "Inbound",
    description:
      "Inbound operations team validating upload, scoring, employee workspace, and management review.",
    leadEmail: "lead@orbit.local",
    memberEmails: ["lead@orbit.local", "viewer@orbit.local"],
  },
  {
    id: "83100000-0000-4000-8000-000000000002",
    name: "Outbound",
    description:
      "Outbound operations team validating team performance, trends, corrective actions, and reports.",
    leadEmail: "manager@orbit.local",
    memberEmails: ["manager@orbit.local", "reviewer@orbit.local"],
  },
  {
    id: "83100000-0000-4000-8000-000000000003",
    name: "Pre-Approvals IP Offshore",
    description:
      "Offshore Pre-Approvals team validating period behavior, access boundaries, support, and rollback readiness.",
    leadEmail: "lead@orbit.local",
    memberEmails: ["lead@orbit.local", "reviewer@orbit.local"],
  },
] as const;

// The supplied planning baseline does not define canonical shared capabilities.
// Users can add and include capabilities later through the existing workspace.
export const pmsPilotCapabilitySeeds: ReadonlyArray<
  readonly [string, "INCLUDED" | "DEFERRED", string]
> = [];

export const pmsPilotCriterionSeeds = [
  {
    id: "83200000-0000-4000-8000-000000000001",
    code: "ENTRY-OWNERS",
    type: PilotCriterionType.ENTRY,
    title: "Support and rollback owners confirmed",
    description: "Named owners accept Pilot operating hours, escalation, and rollback responsibilities.",
    isRequired: true,
  },
  {
    id: "83200000-0000-4000-8000-000000000002",
    code: "ENTRY-SCOPE",
    type: PilotCriterionType.ENTRY,
    title: "Pilot teams, users, and capability scope approved",
    description: "Participants and included/deferred capability boundaries are confirmed.",
    isRequired: true,
  },
  {
    id: "83200000-0000-4000-8000-000000000003",
    code: "ENTRY-ROLLBACK",
    type: PilotCriterionType.ENTRY,
    title: "Release and rollback rehearsal passed",
    description: "The release package, database migration, backup, and rollback path have evidence.",
    isRequired: true,
  },
  {
    id: "83200000-0000-4000-8000-000000000004",
    code: "EXIT-UAT",
    type: PilotCriterionType.EXIT,
    title: "Pilot UAT outcomes accepted",
    description: "Required business scenarios pass and limitations are explicitly accepted.",
    isRequired: true,
  },
  {
    id: "83200000-0000-4000-8000-000000000005",
    code: "EXIT-BLOCKERS",
    type: PilotCriterionType.EXIT,
    title: "No open blocking Pilot issues",
    description: "Every Pilot blocker is resolved, closed, or formally rejected from release.",
    isRequired: true,
  },
  {
    id: "83200000-0000-4000-8000-000000000006",
    code: "EXIT-SIGNOFF",
    type: PilotCriterionType.EXIT,
    title: "Business and technical evidence assembled",
    description: "Evidence is ready for independent business and technical sign-off.",
    isRequired: true,
  },
] as const;

export const pmsPilotIssueSeeds = [
  {
    id: "83300000-0000-4000-8000-000000000001",
    title: "Pilot support roster requires final confirmation",
    description:
      "Named cover for all proposed Pilot operating hours has not yet been confirmed.",
    severity: RiskLevel.HIGH,
    status: PilotIssueStatus.OPEN,
    isBlocking: true,
    ownerEmail: "manager@orbit.local",
    mitigation:
      "Confirm primary and backup support contacts before the Entry gate review.",
    dueDate: "2026-08-28",
  },
] as const;
