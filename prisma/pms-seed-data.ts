import {
  DeliveryHealth,
  DeliveryStageCode,
  DeploymentEnvironment,
  MilestoneStatus,
  ProjectStatus,
  ReleaseHorizon,
  ReleaseScope,
  RiskLevel,
  WorkItemStatus,
  WorkPackageStage,
} from "../generated/prisma/client";
import roadmapJson from "./data/pms-dashboard-roadmap.json";

type RoadmapOwner =
  | string
  | {
      email: string;
      displayName?: string | null;
    }
  | null;

type RoadmapCheckpoint = {
  code: string;
  plannedDate: string | null;
  actualDate: string | null;
  status: string;
  note: string | null;
};

type RoadmapWorkItem = {
  code: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  notes: string | null;
  status: WorkItemStatus;
  progress: number;
  riskLevel: RiskLevel;
  deliveryStage: DeliveryStageCode;
  lifecycleStage: WorkPackageStage;
  deliveryHealth: DeliveryHealth;
  deploymentEnvironment: DeploymentEnvironment;
  releaseScope: ReleaseScope;
  startDate: string | null;
  dueDate: string | null;
  plannedDates: {
    start: string | null;
    check: string | null;
    productionReady: string | null;
    goLive: string | null;
  };
  actualDates: {
    start: string | null;
    check: string | null;
    productionReady: string | null;
    goLive: string | null;
  };
  nextGate: string | null;
  nextAction: string | null;
  blocker: string | null;
  blockerSummary: string | null;
  implementationNotes: string | null;
  primaryWorkstream: PmsWorkstreamCode;
  supportingWorkstreams: PmsWorkstreamCode[];
  owner: RoadmapOwner;
  checkpoints: RoadmapCheckpoint[];
};

type RoadmapPhase = {
  code: string;
  phaseType: "TECHNICAL" | "BUSINESS";
  name: string;
  businessPurpose: string | null;
  status: MilestoneStatus;
  progress: number;
  riskLevel: RiskLevel;
  deliveryStage: DeliveryStageCode;
  releaseHorizon: ReleaseHorizon;
  sortOrder: number;
  startDate: string | null;
  dueDate: string | null;
  deliveredScope: string | null;
  remainingScope: string | null;
  currentBlockers: string | null;
  nextAction: string | null;
  firstReleaseImpact: string | null;
  workItems: RoadmapWorkItem[];
  sharedCapabilities: Array<{
    code: string;
    sourceReference: string | null;
    dependencyNotes: string | null;
    isCritical: boolean;
  }>;
};

type RoadmapSharedCapability = {
  code: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  notes: string | null;
  status: WorkItemStatus;
  progress: number;
  riskLevel: RiskLevel;
  deliveryStage: DeliveryStageCode;
  startDate: string | null;
  dueDate: string | null;
  nextGate: string | null;
  blocker: string | null;
  primaryWorkstream: PmsWorkstreamCode;
  supportingWorkstreams: PmsWorkstreamCode[];
  owner: RoadmapOwner;
  linkedPhases: Array<{
    code: string;
    sourceReference: string | null;
    dependencyNotes: string | null;
    isCritical: boolean;
  }>;
};

type RoadmapDocument = {
  schemaVersion: 1;
  project: {
    code: string;
    slug: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    progress: number;
    startDate: string | null;
    targetDate: string | null;
  };
  phases: RoadmapPhase[];
  sharedCapabilities: RoadmapSharedCapability[];
};

export type PmsWorkstreamCode = "FRONTEND" | "BACKEND" | "DATABASE";

const roadmap = roadmapJson as unknown as RoadmapDocument;

function requiredDate(value: string | null, label: string) {
  if (!value) throw new Error(`${label} requires a date.`);
  return value;
}

function ownerEmail(owner: RoadmapOwner) {
  if (!owner) return "";
  if (typeof owner === "object") return owner.email.toLowerCase();
  return owner.includes("@") ? owner.toLowerCase() : "";
}

export const PMS_PROJECT_SEED = {
  code: roadmap.project.code,
  slug: roadmap.project.slug,
  name: roadmap.project.name,
  description: roadmap.project.description,
  status: roadmap.project.status,
  progress: roadmap.project.progress,
  startDate: new Date(
    `${requiredDate(roadmap.project.startDate, "PMS project start")}T00:00:00.000Z`,
  ),
  targetDate: new Date(
    `${requiredDate(roadmap.project.targetDate, "PMS project target")}T00:00:00.000Z`,
  ),
} as const;

export const pmsMilestoneSeeds = roadmap.phases.map((phase) => ({
  code: phase.code,
  name: phase.name,
  businessPurpose: phase.businessPurpose,
  status: phase.status,
  progress: phase.progress,
  riskLevel: phase.riskLevel,
  deliveryStage: phase.deliveryStage,
  releaseHorizon: phase.releaseHorizon,
  sortOrder: phase.sortOrder,
  startDate: requiredDate(phase.startDate, `${phase.code} start`),
  dueDate: requiredDate(phase.dueDate, `${phase.code} due`),
  deliveredScope: phase.deliveredScope,
  remainingScope: phase.remainingScope,
  currentBlockers: phase.currentBlockers,
  nextAction: phase.nextAction,
  firstReleaseImpact: phase.firstReleaseImpact,
}));

export const pmsWorkItemSeeds = roadmap.phases.flatMap((phase) =>
  phase.workItems.map((item) => ({
    milestoneCode: phase.code,
    code: item.code,
    name: item.name,
    description: item.description,
    acceptanceCriteria: item.acceptanceCriteria,
    notes: item.notes,
    status: item.status,
    progress: item.progress,
    riskLevel: item.riskLevel,
    deliveryStage: item.deliveryStage,
    lifecycleStage: item.lifecycleStage,
    deliveryHealth: item.deliveryHealth,
    deploymentEnvironment: item.deploymentEnvironment,
    releaseScope: item.releaseScope,
    startDate: requiredDate(item.startDate, `${item.code} start`),
    dueDate: requiredDate(item.dueDate, `${item.code} due`),
    plannedStartDate: item.plannedDates.start,
    plannedCheckDate: item.plannedDates.check,
    plannedProductionReadyDate: item.plannedDates.productionReady,
    plannedGoLiveDate: item.plannedDates.goLive,
    actualStartDate: item.actualDates.start,
    actualCheckDate: item.actualDates.check,
    actualProductionReadyDate: item.actualDates.productionReady,
    actualGoLiveDate: item.actualDates.goLive,
    nextGate: item.nextGate,
    nextAction: item.nextAction,
    blocker: item.blocker,
    blockerSummary: item.blockerSummary,
    implementationNotes: item.implementationNotes,
    primaryWorkstream: item.primaryWorkstream,
    supportingWorkstreams: item.supportingWorkstreams,
    ownerEmail: ownerEmail(item.owner),
    checkpoints: item.checkpoints,
  })),
);

export const pmsSharedCapabilitySeeds = roadmap.sharedCapabilities.map(
  (capability) => ({
    code: capability.code,
    name: capability.name,
    description: capability.description,
    acceptanceCriteria: capability.acceptanceCriteria,
    notes: capability.notes,
    status: capability.status,
    progress: capability.progress,
    riskLevel: capability.riskLevel,
    deliveryStage: capability.deliveryStage,
    startDate: requiredDate(
      capability.startDate,
      `${capability.code} start`,
    ),
    dueDate: requiredDate(capability.dueDate, `${capability.code} due`),
    nextGate: capability.nextGate,
    blocker: capability.blocker,
    primaryWorkstream: capability.primaryWorkstream,
    supportingWorkstreams: capability.supportingWorkstreams,
    ownerEmail: ownerEmail(capability.owner),
    milestoneCodes: capability.linkedPhases.map(({ code }) => code),
    milestoneLinks: capability.linkedPhases,
  }),
);

export const PMS_CANONICAL_CAPABILITY_NAMES = pmsSharedCapabilitySeeds.map(
  ({ name }) => name,
);

export function validatePmsSeedDefinitions() {
  if (roadmap.schemaVersion !== 1) {
    throw new Error("PMS roadmap seed uses an unsupported schema version.");
  }
  if (
    roadmap.project.code !== "PMS" ||
    roadmap.project.slug !== "pms-dashboard"
  ) {
    throw new Error("PMS roadmap seed targets an unexpected project.");
  }

  const milestoneCodes = new Set(
    pmsMilestoneSeeds.map(({ code }) => code),
  );
  const workItemCodes = new Set(pmsWorkItemSeeds.map(({ code }) => code));
  const capabilityCodes = new Set(
    pmsSharedCapabilitySeeds.map(({ code }) => code),
  );
  if (
    milestoneCodes.size !== pmsMilestoneSeeds.length ||
    workItemCodes.size !== pmsWorkItemSeeds.length ||
    capabilityCodes.size !== pmsSharedCapabilitySeeds.length
  ) {
    throw new Error("PMS seed definitions contain duplicate codes.");
  }

  for (const phase of roadmap.phases) {
    const expectedType = phase.code.startsWith("BPH-")
      ? "BUSINESS"
      : "TECHNICAL";
    if (phase.phaseType !== expectedType) {
      throw new Error(`${phase.code} has an invalid phase type.`);
    }
    if (
      !phase.startDate ||
      !phase.dueDate ||
      phase.startDate > phase.dueDate
    ) {
      throw new Error(`${phase.code} has an invalid date range.`);
    }
  }

  for (const item of pmsWorkItemSeeds) {
    if (!milestoneCodes.has(item.milestoneCode)) {
      throw new Error(
        `Work Item ${item.code} references an unknown milestone.`,
      );
    }
    if (
      item.progress < 0 ||
      item.progress > 100 ||
      item.startDate > item.dueDate
    ) {
      throw new Error(`Work Item ${item.code} has invalid planning values.`);
    }
    if (
      new Set(item.supportingWorkstreams).size !==
        item.supportingWorkstreams.length ||
      item.supportingWorkstreams.includes(item.primaryWorkstream)
    ) {
      throw new Error(
        `Work Item ${item.code} has invalid Workstream assignments.`,
      );
    }
    const checkpointCodes = item.checkpoints.map(({ code }) => code);
    if (new Set(checkpointCodes).size !== checkpointCodes.length) {
      throw new Error(
        `Work Item ${item.code} contains duplicate checkpoints.`,
      );
    }
  }

  for (const capability of pmsSharedCapabilitySeeds) {
    if (
      capability.milestoneCodes.some((code) => !milestoneCodes.has(code))
    ) {
      throw new Error(
        `Shared Capability ${capability.code} references an unknown milestone.`,
      );
    }
  }
}
