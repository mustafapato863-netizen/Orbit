import {
  DecisionStatus,
  RiskLevel,
  RiskStatus,
} from "../generated/prisma/client";

const WorkstreamCode = {
  FRONTEND: "FRONTEND",
  BACKEND: "BACKEND",
  DATABASE: "DATABASE",
} as const;

export const pmsRiskSeeds = [
  {
    id: "80000000-0000-4000-8000-000000000001",
    title: "Permission coverage is incomplete",
    description:
      "Authentication and role-based access remain At Risk until every server-side workflow is covered.",
    probability: 4,
    impact: 5,
    severity: RiskLevel.HIGH,
    status: RiskStatus.MITIGATING,
    milestoneCode: "PH-03",
    workItemCode: "PH-03.W08",
    capabilityCode: null,
    primaryWorkstream: WorkstreamCode.BACKEND,
    ownerEmail: "manager@orbit.local",
    mitigation:
      "Complete the permission matrix and verify negative access paths before release review.",
    dueDate: "2026-08-03",
  },
  {
    id: "80000000-0000-4000-8000-000000000002",
    title: "Delivery roadmap baseline is overdue",
    description:
      "The date-driven roadmap and milestone grouping are behind the approved implementation schedule.",
    probability: 4,
    impact: 4,
    severity: RiskLevel.HIGH,
    status: RiskStatus.MITIGATING,
    milestoneCode: "PH-05",
    workItemCode: "PH-05.W10",
    capabilityCode: null,
    primaryWorkstream: WorkstreamCode.FRONTEND,
    ownerEmail: "manager@orbit.local",
    mitigation:
      "Finish timeline rendering, validate positions, and capture responsive evidence.",
    dueDate: "2026-07-31",
  },
  {
    id: "80000000-0000-4000-8000-000000000003",
    title: "Corrective action workflow is at risk",
    description:
      "Owners, due dates, and follow-up states are not yet complete for the first-release business workflow.",
    probability: 3,
    impact: 4,
    severity: RiskLevel.HIGH,
    status: RiskStatus.OPEN,
    milestoneCode: "BPH-06",
    workItemCode: "BUS-04.5",
    capabilityCode: null,
    primaryWorkstream: WorkstreamCode.FRONTEND,
    ownerEmail: "manager@orbit.local",
    mitigation:
      "Confirm accountable owners and validate overdue follow-up behavior.",
    dueDate: "2026-08-31",
  },
] as const;

export const pmsDecisionSeeds = [
  {
    id: "81000000-0000-4000-8000-000000000001",
    title: "Approve the summary and snapshot API contract",
    description:
      "Management must confirm the selectors and fields required by the final executive snapshot.",
    milestoneCode: "PH-03",
    affectedWorkstreams: [
      WorkstreamCode.FRONTEND,
      WorkstreamCode.BACKEND,
      WorkstreamCode.DATABASE,
    ],
    requiredBy: "2026-08-05",
    recommendedDirection:
      "Freeze one canonical summary contract shared by the dashboard and report snapshot.",
    ownerEmail: "manager@orbit.local",
    status: DecisionStatus.PENDING,
    decisionText: null,
  },
  {
    id: "81000000-0000-4000-8000-000000000002",
    title: "Confirm the responsive roadmap acceptance baseline",
    description:
      "The release team needs one agreed desktop, tablet, and mobile acceptance baseline.",
    milestoneCode: "PH-05",
    affectedWorkstreams: [
      WorkstreamCode.FRONTEND,
      WorkstreamCode.BACKEND,
    ],
    requiredBy: "2026-08-02",
    recommendedDirection:
      "Use the approved light-mode design reference and preserve in-place editing actions.",
    ownerEmail: "manager@orbit.local",
    status: DecisionStatus.PENDING,
    decisionText: null,
  },
  {
    id: "81000000-0000-4000-8000-000000000003",
    title: "Adopt the seven-phase Technical and Business Release 1 baseline",
    description:
      "The Release 1 roadmap separates technical delivery and Business adoption into seven accountable phases each.",
    milestoneCode: "PH-07",
    affectedWorkstreams: [
      WorkstreamCode.FRONTEND,
      WorkstreamCode.BACKEND,
      WorkstreamCode.DATABASE,
    ],
    requiredBy: "2026-07-26",
    recommendedDirection:
      "Use the seven approved technical phases alongside the seven business phases as the active Release 1 baseline.",
    ownerEmail: "manager@orbit.local",
    status: DecisionStatus.APPROVED,
    decisionText:
      "The seven Technical phases, seven Business phases and their approval gates are the active Release 1 baseline; existing Business additions remain preserved.",
  },
] as const;

export const pmsDecisionCommentSeeds = [
  {
    id: "82000000-0000-4000-8000-000000000001",
    decisionId: "81000000-0000-4000-8000-000000000003",
    authorEmail: "reviewer@orbit.local",
    body: "Approved: use the seven technical phases, detailed work items, dates, progress, and explicit verification gates.",
  },
] as const;
