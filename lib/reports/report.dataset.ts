import { createHash } from "node:crypto";

import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/pipeline/pipeline";
import type { ReportProjectSource } from "@/lib/reports/report.repository";

export const OWNER_NOT_ASSIGNED = "Owner Not Assigned";

export type ReportFormat = "POWERPOINT" | "EXCEL";
export type PackageKind = "Work Item" | "Shared Capability";

export type ReportPackage = {
  id: string;
  canonicalKey: string;
  kind: PackageKind;
  code: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  riskLevel: string;
  deliveryStage: string;
  nextGate: string;
  startDate: string | null;
  dueDate: string | null;
  blocker: string;
  acceptanceCriteria: string;
  owner: string;
  primaryWorkstream: string;
  primaryWorkstreamCode: string;
  supportingWorkstreams: string[];
  supportingWorkstreamCodes: string[];
  milestoneIds: string[];
  milestoneNames: string[];
};

export type ReportDataset = ReturnType<typeof buildReportDataset>;

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function text(value: string | null | undefined, fallback = "Not recorded") {
  return value?.trim() || fallback;
}

function mapPackage(
  item: ReportProjectSource["milestones"][number]["workItems"][number],
  milestone: { id: string; name: string },
): ReportPackage {
  return {
    id: item.id,
    canonicalKey: `work-item:${item.id}`,
    kind: "Work Item",
    code: item.code,
    name: item.name,
    description: text(item.description),
    status: item.status,
    progress: item.progress,
    riskLevel: item.riskLevel,
    deliveryStage: item.deliveryStage,
    nextGate: text(item.nextGate, "No next gate recorded"),
    startDate: iso(item.startDate),
    dueDate: iso(item.dueDate),
    blocker: text(item.blocker, "No blocker recorded"),
    acceptanceCriteria: text(item.acceptanceCriteria),
    owner: item.owner?.displayName || OWNER_NOT_ASSIGNED,
    primaryWorkstream: item.primaryWorkstream.name,
    primaryWorkstreamCode: item.primaryWorkstream.code,
    supportingWorkstreams: item.supportingWorkstreams.map(({ workstream }) => workstream.name),
    supportingWorkstreamCodes: item.supportingWorkstreams.map(({ workstream }) => workstream.code),
    milestoneIds: [milestone.id],
    milestoneNames: [milestone.name],
  };
}

function mapCapability(
  item: ReportProjectSource["sharedCapabilities"][number],
): ReportPackage {
  return {
    id: item.id,
    canonicalKey: `shared-capability:${item.id}`,
    kind: "Shared Capability",
    code: item.code,
    name: item.name,
    description: text(item.description),
    status: item.status,
    progress: item.progress,
    riskLevel: item.riskLevel,
    deliveryStage: item.deliveryStage,
    nextGate: text(item.nextGate, "No next gate recorded"),
    startDate: iso(item.startDate),
    dueDate: iso(item.dueDate),
    blocker: text(item.blocker, "No blocker recorded"),
    acceptanceCriteria: text(item.acceptanceCriteria),
    owner: item.owner?.displayName || OWNER_NOT_ASSIGNED,
    primaryWorkstream: item.primaryWorkstream.name,
    primaryWorkstreamCode: item.primaryWorkstream.code,
    supportingWorkstreams: item.supportingWorkstreams.map(({ workstream }) => workstream.name),
    supportingWorkstreamCodes: item.supportingWorkstreams.map(({ workstream }) => workstream.code),
    milestoneIds: item.milestoneLinks.map(({ milestone }) => milestone.id),
    milestoneNames: item.milestoneLinks.map(({ milestone }) => milestone.name),
  };
}

function active(status: string) {
  return !["COMPLETED", "CANCELLED", "ARCHIVED", "CLOSED"].includes(status);
}

export function buildReportDataset(source: ReportProjectSource, generatedAt = new Date()) {
  const workItems = source.milestones.flatMap((milestone) =>
    milestone.workItems.map((item) => mapPackage(item, milestone)),
  );
  const sharedCapabilities = source.sharedCapabilities.map(mapCapability);
  const canonicalPackages = [...workItems, ...sharedCapabilities];
  const uniqueKeys = new Set(canonicalPackages.map(({ canonicalKey }) => canonicalKey));
  if (uniqueKeys.size !== canonicalPackages.length) {
    throw new Error("Canonical report package keys must be unique.");
  }

  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [
      stage,
      canonicalPackages.filter(({ deliveryStage }) => deliveryStage === stage).length,
    ]),
  ) as Record<(typeof PIPELINE_STAGES)[number], number>;

  const configuredWorkstreams = new Map<string, string>();
  for (const item of canonicalPackages) {
    configuredWorkstreams.set(item.primaryWorkstreamCode, item.primaryWorkstream);
    item.supportingWorkstreamCodes.forEach((code, index) => {
      configuredWorkstreams.set(code, item.supportingWorkstreams[index] ?? code);
    });
  }
  const workstreams = [...configuredWorkstreams.entries()]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([code, name]) => {
    const related: Array<ReportPackage & { assignment: "Primary" | "Supporting" }> = [];
    for (const item of canonicalPackages) {
      if (item.primaryWorkstreamCode === code) {
        related.push({ ...item, assignment: "Primary" });
      } else if (item.supportingWorkstreamCodes.includes(code)) {
        related.push({ ...item, assignment: "Supporting" });
      }
    }
    return {
      code,
      name,
      primaryCount: related.filter(({ assignment }) => assignment === "Primary").length,
      supportingCount: related.filter(({ assignment }) => assignment === "Supporting").length,
      uniqueCount: new Set(related.map(({ canonicalKey }) => canonicalKey)).size,
      averageProgress: related.length
        ? Math.round(related.reduce((sum, item) => sum + item.progress, 0) / related.length)
        : 0,
      items: related,
    };
    });

  const milestones = source.milestones.map((milestone) => ({
    id: milestone.id,
    code: milestone.code,
    name: milestone.name,
    businessPurpose: text(milestone.businessPurpose),
    status: milestone.status,
    progress: milestone.progress,
    riskLevel: milestone.riskLevel,
    deliveryStage: milestone.deliveryStage,
    releaseHorizon: milestone.releaseHorizon,
    startDate: iso(milestone.startDate),
    dueDate: iso(milestone.dueDate),
    deliveredScope: text(milestone.deliveredScope),
    remainingScope: text(milestone.remainingScope),
    currentBlockers: text(milestone.currentBlockers, "No blocker recorded"),
    nextAction: text(milestone.nextAction),
    firstReleaseImpact: text(milestone.firstReleaseImpact),
    workItems: workItems.filter(({ milestoneIds }) => milestoneIds.includes(milestone.id)),
    sharedDependencies: sharedCapabilities
      .filter(({ milestoneIds }) => milestoneIds.includes(milestone.id))
      .map(({ canonicalKey, code, name }) => ({ canonicalKey, code, name })),
  }));

  const risks = source.risks.map((risk) => ({
    id: risk.id,
    title: risk.title,
    description: risk.description,
    probability: risk.probability,
    impact: risk.impact,
    severity: risk.severity,
    status: risk.status,
    mitigation: text(risk.mitigation),
    dueDate: iso(risk.dueDate),
    owner: risk.owner?.displayName || OWNER_NOT_ASSIGNED,
    milestone: risk.milestone?.name ?? "Project level",
    relatedPackage: risk.workItem?.name ?? risk.sharedCapability?.name ?? "Project level",
    primaryWorkstream: risk.primaryWorkstream?.name ?? "Not assigned",
  }));

  const decisions = source.decisions.map((decision) => ({
    id: decision.id,
    title: decision.title,
    description: decision.description,
    requiredBy: iso(decision.requiredBy),
    recommendedDirection: text(decision.recommendedDirection),
    status: decision.status,
    decisionText: text(decision.decisionText, "Decision pending"),
    decidedAt: iso(decision.decidedAt),
    owner: decision.owner?.displayName || OWNER_NOT_ASSIGNED,
    milestone: decision.milestone?.name ?? "Project level",
    affectedWorkstreams: decision.affectedWorkstreams.map(({ workstream }) => workstream.name),
  }));

  const pilot = source.pilotScope
    ? {
        name: source.pilotScope.name,
        knownLimitations: text(source.pilotScope.knownLimitations, "No known limitations recorded"),
        supportOwner: source.pilotScope.supportOwner?.displayName || OWNER_NOT_ASSIGNED,
        rollbackOwner: source.pilotScope.rollbackOwner?.displayName || OWNER_NOT_ASSIGNED,
        businessSignOffStatus: source.pilotScope.businessSignOffStatus,
        technicalSignOffStatus: source.pilotScope.technicalSignOffStatus,
        finalDecisionStatus: source.pilotScope.finalDecisionStatus,
        finalDecision: text(source.pilotScope.finalDecision, "Decision pending"),
        teams: source.pilotScope.teams.map((team) => ({
          id: team.id,
          name: team.name,
          lead: team.leadUser?.displayName || OWNER_NOT_ASSIGNED,
          users: team.members.map(({ user }) => user.displayName),
        })),
        capabilities: source.pilotScope.capabilities.map((link) => ({
          id: link.sharedCapability.id,
          code: link.sharedCapability.code,
          name: link.sharedCapability.name,
          disposition: link.disposition,
          notes: text(link.notes),
        })),
        criteria: source.pilotScope.criteria.map((criterion) => ({ ...criterion })),
        issues: source.pilotScope.issues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          severity: issue.severity,
          status: issue.status,
          isBlocking: issue.isBlocking,
          dueDate: iso(issue.dueDate),
          mitigation: text(issue.mitigation),
          owner: issue.owner?.displayName || OWNER_NOT_ASSIGNED,
        })),
      }
    : null;

  const upcoming = canonicalPackages
    .filter(({ dueDate, status }) => Boolean(dueDate) && active(status))
    .sort((left, right) => left.dueDate!.localeCompare(right.dueDate!))
    .slice(0, 12);
  const blockers = canonicalPackages.filter(
    ({ status, blocker }) => status === "BLOCKED" || blocker !== "No blocker recorded",
  );
  const highRisk = canonicalPackages.filter(({ riskLevel }) =>
    ["HIGH", "CRITICAL"].includes(riskLevel),
  );
  const releaseOne = milestones.filter(({ releaseHorizon }) => releaseHorizon === "RELEASE_1");
  const releaseOneProgress = releaseOne.length
    ? Math.round(releaseOne.reduce((sum, item) => sum + item.progress, 0) / releaseOne.length)
    : 0;
  const productionCount = stageCounts.PRODUCTION;
  const releaseRecommendation =
    blockers.length > 0 || highRisk.length > 0
      ? "Hold the release gate until material blockers and high-risk packages have accountable mitigations."
      : pilot?.finalDecisionStatus === "APPROVED"
        ? "Proceed with the approved controlled release, retaining support and rollback ownership."
        : "Advance to the next controlled gate when Pilot approvals and verification evidence are complete.";

  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    project: {
      id: source.id,
      code: source.code,
      name: source.name,
      description: text(source.description),
      status: source.status,
      derivedPlanningProgress: canonicalPackages.length
        ? Math.round(canonicalPackages.reduce((sum, item) => sum + item.progress, 0) / canonicalPackages.length)
        : source.progress,
      startDate: iso(source.startDate),
      targetDate: iso(source.targetDate),
    },
    metrics: {
      milestones: milestones.length,
      workItems: workItems.length,
      sharedCapabilities: sharedCapabilities.length,
      canonicalPackages: canonicalPackages.length,
      highRisk: highRisk.length,
      blocked: blockers.length,
      releaseOneProgress,
      productionCount,
      stageCounts,
      stageLabels: PIPELINE_STAGE_LABELS,
    },
    milestones,
    workItems,
    sharedCapabilities,
    canonicalPackages,
    workstreams,
    risks,
    decisions,
    pilot,
    upcoming,
    blockers,
    releaseRecommendation,
  };
}

export function reportDatasetChecksum(dataset: ReportDataset) {
  return createHash("sha256").update(JSON.stringify(dataset)).digest("hex");
}

export function assertReportDatasetComplete(dataset: ReportDataset) {
  const milestoneWorkKeys = dataset.milestones.flatMap(({ workItems }) =>
    workItems.map(({ canonicalKey }) => canonicalKey),
  );
  const allWorkKeys = dataset.workItems.map(({ canonicalKey }) => canonicalKey);
  if (milestoneWorkKeys.length !== allWorkKeys.length) {
    throw new Error("Report coverage failure: Work Item count changed during projection.");
  }
  const covered = new Set(milestoneWorkKeys);
  const missing = allWorkKeys.filter((key) => !covered.has(key));
  if (missing.length) {
    throw new Error(`Report coverage failure: ${missing.length} Work Item(s) were omitted.`);
  }
  if (new Set(dataset.sharedCapabilities.map(({ id }) => id)).size !== dataset.sharedCapabilities.length) {
    throw new Error("Report coverage failure: Shared Capabilities are not canonical.");
  }
}

