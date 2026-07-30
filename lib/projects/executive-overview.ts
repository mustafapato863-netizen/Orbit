export const EXECUTIVE_WORKSTREAMS = [
  "FRONTEND",
  "BACKEND",
  "DATABASE",
] as const;

export type ExecutiveWorkstreamCode = string;

const deliveryStages = [
  "NOT_STARTED",
  "IN_DEVELOPMENT",
  "TECHNICAL_VERIFICATION",
  "BUSINESS_UAT",
  "STAGING",
  "CONTROLLED_PILOT",
  "PRODUCTION",
] as const;

type DeliveryStage = (typeof deliveryStages)[number];
type PlanningStatus =
  | "NOT_PLANNED"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "AT_RISK"
  | "BLOCKED"
  | "COMPLETED";

type TechnicalExecution = {
  id: string;
  code: string;
  name: string;
  status: string;
  progress: number;
  riskLevel: string;
  deliveryStage: string;
  dueDate: Date | null;
  blocker: string | null;
  primaryWorkstream: { code: ExecutiveWorkstreamCode };
  supportingWorkstreams: Array<{
    workstream: { code: ExecutiveWorkstreamCode };
  }>;
};

export type ExecutiveOverviewProject = {
  status: string;
  startDate: Date | null;
  targetDate: Date | null;
  milestones: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
    riskLevel: string;
    deliveryStage: string;
    releaseHorizon: "RELEASE_1" | "PHASE_2";
    dueDate: Date | null;
    currentBlockers: string | null;
    workItems: TechnicalExecution[];
  }>;
  sharedCapabilities: TechnicalExecution[];
};

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function isFinished(status: string) {
  return ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status);
}

function hasText(value: string | null) {
  return Boolean(value?.trim());
}

function isBlocked(item: { status: string; blocker?: string | null }) {
  return item.status === "BLOCKED" || hasText(item.blocker ?? null);
}

function summarizeRelease(
  milestones: ExecutiveOverviewProject["milestones"],
) {
  const progress = average(milestones.map(({ progress }) => progress));
  let status: PlanningStatus = "NOT_PLANNED";

  if (milestones.length) {
    if (milestones.every(({ status: value }) => value === "COMPLETED")) {
      status = "COMPLETED";
    } else if (milestones.some(({ status: value }) => value === "BLOCKED")) {
      status = "BLOCKED";
    } else if (
      milestones.some(
        ({ status: value, riskLevel }) =>
          value === "AT_RISK" ||
          riskLevel === "HIGH" ||
          riskLevel === "CRITICAL",
      )
    ) {
      status = "AT_RISK";
    } else if (
      milestones.some(
        ({ status: value, progress: valueProgress }) =>
          value === "IN_PROGRESS" ||
          value === "COMPLETED" ||
          valueProgress > 0,
      )
    ) {
      status = "IN_PROGRESS";
    } else {
      status = "NOT_STARTED";
    }
  }

  return { status, progress, total: milestones.length };
}

function currentReleaseGate(
  releaseOne: ExecutiveOverviewProject["milestones"],
) {
  if (!releaseOne.length) return "NOT_STARTED" satisfies DeliveryStage;
  if (releaseOne.every(({ status }) => status === "COMPLETED")) {
    return "PRODUCTION" satisfies DeliveryStage;
  }

  const active = releaseOne.filter(
    ({ status }) =>
      status !== "NOT_STARTED" &&
      status !== "COMPLETED" &&
      status !== "ARCHIVED",
  );
  const candidates = active.length
    ? active
    : releaseOne.filter(({ status }) => status !== "COMPLETED");
  return candidates.reduce<DeliveryStage>((earliest, milestone) => {
    const stage = deliveryStages.includes(
      milestone.deliveryStage as DeliveryStage,
    )
      ? (milestone.deliveryStage as DeliveryStage)
      : "NOT_STARTED";
    return deliveryStages.indexOf(stage) < deliveryStages.indexOf(earliest)
      ? stage
      : earliest;
  }, "PRODUCTION");
}

export function buildExecutiveOverview(
  project: ExecutiveOverviewProject,
  now = new Date(),
) {
  const releaseOneMilestones = project.milestones.filter(
    ({ releaseHorizon }) => releaseHorizon === "RELEASE_1",
  );
  const phaseTwoMilestones = project.milestones.filter(
    ({ releaseHorizon }) => releaseHorizon === "PHASE_2",
  );
  const workItems = project.milestones.flatMap(({ workItems }) => workItems);

  // Canonical Shared Capabilities enter this collection once from the project
  // relation. Milestone dependency links are intentionally not an input.
  const technicalItems = [
    ...workItems.map((item) => ({ ...item, kind: "Work Item" as const })),
    ...project.sharedCapabilities.map((item) => ({
      ...item,
      kind: "Shared Capability" as const,
    })),
  ];

  const milestoneBlockers = project.milestones
    .filter(
      ({ status, currentBlockers }) =>
        status === "BLOCKED" || hasText(currentBlockers),
    )
    .map((milestone) => ({
      key: `milestone:${milestone.id}`,
      type: "Milestone" as const,
      code: milestone.code,
      name: milestone.name,
      detail:
        milestone.currentBlockers?.trim() ||
        "Milestone status is recorded as blocked.",
      riskLevel: milestone.riskLevel,
      dueDate: milestone.dueDate,
    }));
  const technicalBlockers = technicalItems
    .filter(isBlocked)
    .map((item) => ({
      key: `${item.kind}:${item.id}`,
      type: item.kind,
      code: item.code,
      name: item.name,
      detail: item.blocker?.trim() || `${item.kind} status is blocked.`,
      riskLevel: item.riskLevel,
      dueDate: item.dueDate,
    }));
  const riskOrder = new Map([
    ["CRITICAL", 0],
    ["HIGH", 1],
    ["MEDIUM", 2],
    ["LOW", 3],
  ]);
  const blockers = [...milestoneBlockers, ...technicalBlockers].sort(
    (left, right) =>
      (riskOrder.get(left.riskLevel) ?? 4) -
        (riskOrder.get(right.riskLevel) ?? 4) ||
      (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
  );

  const dueItems = [
    ...project.milestones.map((milestone) => ({
      key: `milestone:${milestone.id}`,
      type: "Milestone" as const,
      code: milestone.code,
      name: milestone.name,
      status: milestone.status,
      dueDate: milestone.dueDate,
      riskLevel: milestone.riskLevel,
    })),
    ...technicalItems.map((item) => ({
      key: `${item.kind}:${item.id}`,
      type: item.kind,
      code: item.code,
      name: item.name,
      status: item.status,
      dueDate: item.dueDate,
      riskLevel: item.riskLevel,
    })),
  ]
    .filter(
      (
        item,
      ): item is typeof item & {
        dueDate: Date;
      } => Boolean(item.dueDate) && !isFinished(item.status),
    )
    .sort(
      (left, right) =>
        left.dueDate.getTime() - right.dueDate.getTime() ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 6)
    .map((item) => ({
      ...item,
      isOverdue: item.dueDate.getTime() < now.getTime(),
    }));

  const configuredWorkstreamCodes = [
    ...new Set(
      technicalItems.flatMap((item) => [
        item.primaryWorkstream.code,
        ...item.supportingWorkstreams.map(({ workstream }) => workstream.code),
      ]),
    ),
  ];
  const workstreams = configuredWorkstreamCodes.map((code) => {
    const primary = technicalItems.filter(
      ({ primaryWorkstream }) => primaryWorkstream.code === code,
    );
    const supporting = technicalItems.filter(({ supportingWorkstreams }) =>
      supportingWorkstreams.some(
        ({ workstream }) => workstream.code === code,
      ),
    );
    const uniqueItems = [...primary, ...supporting];
    return {
      code,
      total: uniqueItems.length,
      primary: primary.length,
      supporting: supporting.length,
      completed: uniqueItems.filter(({ status }) => status === "COMPLETED")
        .length,
      active: uniqueItems.filter(
        ({ status }) => !isFinished(status) && status !== "NOT_STARTED",
      ).length,
      blocked: uniqueItems.filter(isBlocked).length,
      planningProgress: average(
        uniqueItems.map(({ progress }) => progress),
      ),
    };
  });

  const releaseOne = summarizeRelease(releaseOneMilestones);
  const phaseTwo = summarizeRelease(phaseTwoMilestones);
  const highRiskMilestones = project.milestones.filter(
    ({ riskLevel }) => riskLevel === "HIGH" || riskLevel === "CRITICAL",
  ).length;
  const releaseOneNeedsAttention = releaseOneMilestones.some(
    ({ status, riskLevel, currentBlockers, workItems: milestoneWorkItems }) =>
      status === "BLOCKED" ||
      status === "AT_RISK" ||
      riskLevel === "HIGH" ||
      riskLevel === "CRITICAL" ||
      hasText(currentBlockers) ||
      milestoneWorkItems.some(isBlocked),
  );

  return {
    derivedPlanningProgress: average(
      project.milestones.map(({ progress }) => progress),
    ),
    totalMilestones: project.milestones.length,
    highRiskMilestones,
    blockedItems: blockers.length,
    releaseOne,
    phaseTwo,
    currentReleaseGate: currentReleaseGate(releaseOneMilestones),
    recommendedFirstRelease: releaseOne.total
      ? {
          label: "Release 1",
          description:
            releaseOneNeedsAttention
              ? "Proceed after current blockers and high-risk milestones are cleared."
              : releaseOne.status === "COMPLETED"
                ? "Release 1 scope is ready for final release confirmation."
                : "Keep Phase 2 deferred until Release 1 reaches its approval gates.",
        }
      : {
          label: "Not defined",
          description: "Classify at least one Main Milestone as Release 1.",
        },
    upcomingDueItems: dueItems,
    blockers: blockers.slice(0, 6),
    workstreams,
  };
}
