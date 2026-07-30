import type { DeliveryPipelineProject } from "@/lib/repositories/delivery-pipeline.repository";

export const PIPELINE_STAGES = [
  "NOT_STARTED",
  "IN_DEVELOPMENT",
  "TECHNICAL_VERIFICATION",
  "BUSINESS_UAT",
  "STAGING",
  "CONTROLLED_PILOT",
  "PRODUCTION",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const OVERVIEW_STAGES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY_FOR_CHECK",
  "READY_FOR_PRODUCTION",
  "LIVE",
] as const;

export type OverviewStage = (typeof OVERVIEW_STAGES)[number];

export const OVERVIEW_STAGE_LABELS: Record<OverviewStage, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  READY_FOR_CHECK: "Under Review",
  READY_FOR_PRODUCTION: "Approved",
  LIVE: "Completed",
};

export const OVERVIEW_STAGE_CODES: Record<OverviewStage, string> = {
  NOT_STARTED: "NS",
  IN_PROGRESS: "IP",
  READY_FOR_CHECK: "REV",
  READY_FOR_PRODUCTION: "APR",
  LIVE: "DONE",
};

export function overviewStageFor(stage: string | null): OverviewStage {
  switch (stage) {
    case "IN_DEVELOPMENT":
    case "IP":
      return "IN_PROGRESS";
    case "TECHNICAL_VERIFICATION":
    case "BUSINESS_UAT":
    case "CHK":
      return "READY_FOR_CHECK";
    case "STAGING":
    case "CONTROLLED_PILOT":
    case "RPR":
      return "READY_FOR_PRODUCTION";
    case "PRODUCTION":
    case "LIVE":
      return "LIVE";
    default:
      return "NOT_STARTED";
  }
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  NOT_STARTED: "Not Started",
  IN_DEVELOPMENT: "In Progress",
  TECHNICAL_VERIFICATION: "Under Review",
  BUSINESS_UAT: "Under Review",
  STAGING: "Approved",
  CONTROLLED_PILOT: "Approved",
  PRODUCTION: "Completed",
};

export const PIPELINE_EVENT_LABELS = [
  ["Next Start", "NOT_STARTED", "startDate"],
  ["Next Development Complete", "IN_DEVELOPMENT", "dueDate"],
  [
    "Next Verification Complete",
    "TECHNICAL_VERIFICATION",
    "dueDate",
  ],
  ["Next UAT Approval", "BUSINESS_UAT", "dueDate"],
  ["Next Staging Release", "STAGING", "dueDate"],
  ["Next Pilot Gate", "CONTROLLED_PILOT", "dueDate"],
  ["Next Production Release", "PRODUCTION", "dueDate"],
] as const satisfies readonly [
  string,
  PipelineStage,
  "startDate" | "dueDate",
][];

type PipelinePackage =
  DeliveryPipelineProject["sharedCapabilities"][number];


function hasRisk(item: PipelinePackage) {
  return (
    item.status === "AT_RISK" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function active(item: PipelinePackage) {
  return !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(item.status);
}

export function nextStage(stage: string) {
  const index = PIPELINE_STAGES.indexOf(stage as PipelineStage);
  if (index < 0) return PIPELINE_STAGE_LABELS.NOT_STARTED;
  return index === PIPELINE_STAGES.length - 1
    ? "Release complete"
    : PIPELINE_STAGE_LABELS[PIPELINE_STAGES[index + 1]!];
}

export function nextExpandedMilestone(
  currentMilestoneId: string | null,
  requestedMilestoneId: string,
) {
  return currentMilestoneId === requestedMilestoneId
    ? null
    : requestedMilestoneId;
}

type JourneySource = {
  startDate: Date | null;
  dueDate: Date | null;
  deliveryStage: string;
  nextGate: string | null;
  deliveryStageHistory: Array<{
    fromStage: string | null;
    toStage: string;
    changedAt: Date;
  }>;
};

function validStage(stage: string | null): PipelineStage {
  return PIPELINE_STAGES.includes(stage as PipelineStage)
    ? (stage as PipelineStage)
    : "NOT_STARTED";
}

export function buildStageJourney(item: JourneySource) {
  const history = [...item.deliveryStageHistory].sort(
    (left, right) => left.changedAt.getTime() - right.changedAt.getTime(),
  );
  const segments: Array<{
    stage: PipelineStage;
    start: Date;
    end: Date;
    isCurrent: boolean;
  }> = [];
  const markers: Array<{
    stage: PipelineStage;
    date: Date;
    label: string;
    kind: "transition" | "next-gate";
  }> = [];

  let cursorStage = validStage(
    history[0]?.fromStage ?? item.deliveryStage,
  );
  let cursorDate = item.startDate ?? history[0]?.changedAt ?? null;

  for (const transition of history) {
    if (
      cursorDate &&
      transition.changedAt.getTime() > cursorDate.getTime()
    ) {
      segments.push({
        stage: cursorStage,
        start: cursorDate,
        end: transition.changedAt,
        isCurrent: false,
      });
    }
    cursorStage = validStage(transition.toStage);
    cursorDate = transition.changedAt;
    markers.push({
      stage: cursorStage,
      date: transition.changedAt,
      label: PIPELINE_STAGE_LABELS[cursorStage],
      kind: "transition",
    });
  }

  const currentStage = validStage(item.deliveryStage);
  const currentStart = cursorDate ?? item.startDate;
  if (
    currentStart &&
    item.dueDate &&
    item.dueDate.getTime() >= currentStart.getTime()
  ) {
    segments.push({
      stage: currentStage,
      start: currentStart,
      end: item.dueDate,
      isCurrent: true,
    });
  }

  if (item.dueDate) {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
    const nextGateStage =
      PIPELINE_STAGES[Math.min(currentIndex + 1, PIPELINE_STAGES.length - 1)]!;
    markers.push({
      stage: nextGateStage,
      date: item.dueDate,
      label: item.nextGate?.trim() || nextStage(currentStage),
      kind: "next-gate",
    });
  }

  return {
    currentStage,
    segments,
    markers,
  };
}

type OverviewJourneySource = JourneySource & {
  lifecycleStage?: string | null;
  plannedStartDate?: Date | null;
  plannedCheckDate?: Date | null;
  plannedProductionReadyDate?: Date | null;
  plannedGoLiveDate?: Date | null;
  actualStartDate?: Date | null;
  actualCheckDate?: Date | null;
  actualProductionReadyDate?: Date | null;
  actualGoLiveDate?: Date | null;
};

const overviewStageOrder = new Map(
  OVERVIEW_STAGES.map((stage, index) => [stage, index]),
);

function currentOverviewStage(item: OverviewJourneySource) {
  const lifecycleStage =
    item.lifecycleStage === "NS" && item.deliveryStage !== "NOT_STARTED"
      ? null
      : item.lifecycleStage;
  return overviewStageFor(lifecycleStage ?? item.deliveryStage);
}

export function buildOverviewJourney(item: OverviewJourneySource) {
  const currentStage = currentOverviewStage(item);
  const scheduled = [
    {
      code: "GO",
      stage: "IN_PROGRESS" as OverviewStage,
      date: item.actualStartDate ?? item.plannedStartDate ?? item.startDate,
      actual: Boolean(item.actualStartDate),
    },
    {
      code: "REV",
      stage: "READY_FOR_CHECK" as OverviewStage,
      date: item.actualCheckDate ?? item.plannedCheckDate,
      actual: Boolean(item.actualCheckDate),
    },
    {
      code: "APR",
      stage: "READY_FOR_PRODUCTION" as OverviewStage,
      date:
        item.actualProductionReadyDate ?? item.plannedProductionReadyDate,
      actual: Boolean(item.actualProductionReadyDate),
    },
    {
      code: "DONE",
      stage: "LIVE" as OverviewStage,
      date: item.actualGoLiveDate ?? item.plannedGoLiveDate,
      actual: Boolean(item.actualGoLiveDate),
    },
  ].filter(
    (marker): marker is {
      code: string;
      stage: OverviewStage;
      date: Date;
      actual: boolean;
    } => Boolean(marker.date),
  );

  const markerByStage = new Map(
    scheduled.map((marker) => [marker.stage, marker]),
  );

  for (const transition of [...item.deliveryStageHistory].sort(
    (left, right) => left.changedAt.getTime() - right.changedAt.getTime(),
  )) {
    const stage = overviewStageFor(transition.toStage);
    if (stage === "NOT_STARTED" || markerByStage.has(stage)) continue;
    markerByStage.set(stage, {
      code: OVERVIEW_STAGE_CODES[stage],
      stage,
      date: transition.changedAt,
      actual: true,
    });
  }

  if (item.dueDate) {
    const dueStage =
      currentStage === "LIVE"
        ? "LIVE"
        : OVERVIEW_STAGES[
            Math.min(
              OVERVIEW_STAGES.length - 1,
              (overviewStageOrder.get(currentStage) ?? 0) + 1,
            )
          ]!;

    if (dueStage !== "NOT_STARTED" && !markerByStage.has(dueStage)) {
      markerByStage.set(dueStage, {
        code: OVERVIEW_STAGE_CODES[dueStage],
        stage: dueStage,
        date: item.dueDate,
        actual: false,
      });
    }
  }

  const markers = [...markerByStage.values()].sort(
    (left, right) =>
      left.date.getTime() - right.date.getTime() ||
      (overviewStageOrder.get(left.stage) ?? 0) -
        (overviewStageOrder.get(right.stage) ?? 0),
  );

  const segments = markers.slice(0, -1).map((marker, index) => ({
    stage: marker.stage,
    start: marker.date,
    end: markers[index + 1]!.date,
    isCurrent: marker.stage === currentStage,
  }));

  return { currentStage, markers, segments };
}

function milestoneWorkstreamSummary(
  milestone: DeliveryPipelineProject["milestones"][number],
) {
  const packages: PipelinePackage[] = [
    ...milestone.workItems,
    ...milestone.sharedCapabilityLinks.map(
      ({ sharedCapability }) => sharedCapability,
    ),
  ];
  const workstreamCodes = [
    ...new Set(
      packages.flatMap(({ primaryWorkstream, supportingWorkstreams }) => [
        primaryWorkstream.code,
        ...supportingWorkstreams.map(({ workstream }) => workstream.code),
      ]),
    ),
  ].sort();

  const counts = Object.fromEntries(
    workstreamCodes.map((code) => {
      const matching = packages.filter(
        ({ primaryWorkstream, supportingWorkstreams }) =>
          primaryWorkstream.code === code ||
          supportingWorkstreams.some(
            ({ workstream }) => workstream.code === code,
          ),
      );
      const primary = packages.filter(
        ({ primaryWorkstream }) => primaryWorkstream.code === code,
      ).length;
      return [code, { total: matching.length, primary }];
    }),
  ) as Record<string, { total: number; primary: number }>;

  const dominant = workstreamCodes.reduce<string | null>((winner, code) => {
    if (!winner) return counts[code].total ? code : null;
    if (counts[code].total > counts[winner].total) return code;
    if (
      counts[code].total === counts[winner].total &&
      counts[code].primary > counts[winner].primary
    ) {
      return code;
    }
    return winner;
  }, null);

  return {
    counts,
    dominant,
  };
}

function timeline(project: DeliveryPipelineProject) {
  const allDates = [
    project.startDate,
    project.targetDate,
    ...project.milestones.flatMap((milestone) => [
      milestone.startDate,
      milestone.dueDate,
      ...milestone.workItems.flatMap((item) => [
        item.startDate,
        item.dueDate,
      ]),
    ]),
    ...project.sharedCapabilities.flatMap((capability) => [
      capability.startDate,
      capability.dueDate,
    ]),
  ].filter((date): date is Date => Boolean(date));
  const start =
    project.startDate ??
    (allDates.length
      ? new Date(Math.min(...allDates.map((date) => date.getTime())))
      : new Date());
  const end =
    project.targetDate ??
    (allDates.length
      ? new Date(Math.max(...allDates.map((date) => date.getTime())))
      : start);
  const startMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
  );
  const endMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
  );
  const timelineEnd = new Date(
    Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() + 1, 1),
  );
  const months: Date[] = [];
  const cursor = new Date(startMonth);
  while (cursor <= endMonth && months.length < 36) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return {
    start: startMonth,
    end: timelineEnd,
    months: months.map((date) => ({
      iso: date.toISOString(),
      label: new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
    })),
  };
}

export function buildDeliveryPipeline(
  project: DeliveryPipelineProject,
  now = new Date(),
) {
  // Each Work Item is milestone-owned and therefore appears once. Canonical
  // Shared Capabilities enter from the project relation, never from links.
  const canonicalPackages: PipelinePackage[] = [
    ...project.milestones.flatMap(({ workItems }) => workItems),
    ...project.sharedCapabilities,
  ];
  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [
      stage,
      canonicalPackages.filter(
        ({ deliveryStage }) => deliveryStage === stage,
      ).length,
    ]),
  ) as Record<PipelineStage, number>;
  const total = canonicalPackages.length;
  const visiblePackages = canonicalPackages.filter(
    ({ status }) => !["CANCELLED", "ARCHIVED"].includes(status),
  );
  const overviewStageCounts = Object.fromEntries(
    OVERVIEW_STAGES.map((stage) => [
      stage,
      canonicalPackages.filter(
        (item) => currentOverviewStage(item) === stage,
      ).length,
    ]),
  ) as Record<OverviewStage, number>;

  const roadmapGroups = project.milestones.map((milestone) => {
    const workstreamSummary = milestoneWorkstreamSummary(milestone);
    const specificItems = milestone.workItems
      .filter(({ status }) => !["CANCELLED", "ARCHIVED"].includes(status))
      .map((item) => ({ ...item, itemKind: "specific" as const }));
    const sharedItems = milestone.sharedCapabilityLinks
      .filter(({ sharedCapability }) =>
        !["CANCELLED", "ARCHIVED"].includes(sharedCapability.status),
      )
      .map(({ sharedCapability, sourceReference, isCritical }) => ({
        ...sharedCapability,
        itemKind: "shared" as const,
        sourceReference,
        isCritical,
      }));
    return {
      code: milestone.code,
      label: `${milestone.code} ${milestone.name}`,
      id: milestone.id,
      name: milestone.name,
      progress: milestone.progress,
      stage: overviewStageFor(milestone.deliveryStage),
      riskLevel: milestone.riskLevel,
      startDate: milestone.startDate,
      dueDate: milestone.dueDate,
      nextAction: null as string | null,
      specificCount: specificItems.length,
      sharedCount: sharedItems.length,
      dominantWorkstream: workstreamSummary.dominant,
      items: [...specificItems, ...sharedItems].sort(
        (left, right) =>
          (left.itemKind === right.itemKind
            ? 0
            : left.itemKind === "specific"
              ? -1
              : 1) ||
          (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
          left.name.localeCompare(right.name),
      ),
    };
  });

  const eventDefinitions: Array<{
    code: string;
    label: string;
    subtitle: string;
    stage: OverviewStage;
    dateFor: (
      item: DeliveryPipelineProject["milestones"][number]["workItems"][number],
    ) => Date | null;
    eligible: (stage: OverviewStage) => boolean;
  }> = [
    {
      code: "GO",
      label: "Next Start",
      subtitle: "Project kickoff",
      stage: "NOT_STARTED",
      dateFor: (item) => item.startDate,
      eligible: (stage) => stage === "NOT_STARTED",
    },
    {
      code: "REV",
      label: "Next Review",
      subtitle: "Review due",
      stage: "READY_FOR_CHECK",
      dateFor: (item) => item.dueDate,
      eligible: (stage) => stage === "IN_PROGRESS",
    },
    {
      code: "APR",
      label: "Next Approval",
      subtitle: "Approval due",
      stage: "READY_FOR_PRODUCTION",
      dateFor: (item) => item.dueDate,
      eligible: (stage) => stage === "READY_FOR_CHECK",
    },
    {
      code: "DONE",
      label: "Next Completion",
      subtitle: "Delivery completion",
      stage: "LIVE",
      dateFor: (item) => item.dueDate,
      eligible: (stage) => stage === "READY_FOR_PRODUCTION",
    },
  ];

  const scheduledWorkItems = project.milestones.flatMap(
    ({ workItems }) => workItems,
  );
  const nextEvents = eventDefinitions.flatMap((definition) => {
    const next = scheduledWorkItems
      .map((item) => ({
        item,
        date: definition.dateFor(item),
        currentStage: currentOverviewStage(item),
      }))
      .filter(
        (candidate): candidate is {
          item: (typeof scheduledWorkItems)[number];
          date: Date;
          currentStage: OverviewStage;
        } =>
          Boolean(candidate.date) &&
          active(candidate.item) &&
          definition.eligible(candidate.currentStage) &&
          candidate.date!.getTime() >= now.getTime(),
      )
      .sort(
        (left, right) =>
          left.date.getTime() - right.date.getTime() ||
          left.item.name.localeCompare(right.item.name),
      )[0];
    return next
      ? [
          {
            code: definition.code,
            label: definition.label,
            subtitle: definition.subtitle,
            stage: definition.stage,
            date: next.date,
            isOverdue: false,
            packageName: next.item.name,
            packageCode: next.item.code,
          },
        ]
      : [];
  });

  return {
    asOfDate: now,
    totalCanonicalPackages: total,
    shownCanonicalPackages: visiblePackages.length,
    hiddenCanonicalPackages: total - visiblePackages.length,
    atRiskCount: canonicalPackages.filter(hasRisk).length,
    stageCounts,
    overviewStageCounts,
    stageDistribution: OVERVIEW_STAGES.map((stage) => ({
      stage,
      count: overviewStageCounts[stage],
      percentage: total ? (overviewStageCounts[stage] / total) * 100 : 0,
    })),
    nextEvents,
    roadmapGroups,
    timeline: timeline(project),
    milestones: project.milestones.map((milestone) => {
      const workstreams = milestoneWorkstreamSummary(milestone);
      return {
        ...milestone,
        specificWorkCount: milestone.workItems.length,
        sharedDependencyCount: milestone.sharedCapabilityLinks.length,
        dominantWorkstream: workstreams.dominant,
        workstreamCounts: Object.fromEntries(
          Object.entries(workstreams.counts).map(([code, count]) => [
            code,
            count.total,
          ]),
        ),
        nextGate: nextStage(milestone.deliveryStage),
      };
    }),
  };
}

export type DeliveryPipelineView = ReturnType<
  typeof buildDeliveryPipeline
>;
