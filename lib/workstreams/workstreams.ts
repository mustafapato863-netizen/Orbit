import type { DeliveryPipelineProject } from "@/lib/repositories/delivery-pipeline.repository";

export type WorkstreamIdentity = {
  id: string;
  code: string;
  slug: string;
  name: string;
  description?: string | null;
  colorToken?: string;
  iconKey?: string;
  sortOrder?: number;
};

export type WorkstreamSlug = string;
type Assignment = "Primary" | "Supporting";

function assignmentFor(
  item: {
    primaryWorkstream: { id: string };
    supportingWorkstreams: Array<{ workstream: { id: string } }>;
  },
  workstreamId: string,
): Assignment | null {
  if (item.primaryWorkstream.id === workstreamId) return "Primary";
  return item.supportingWorkstreams.some(({ workstream }) => workstream.id === workstreamId)
    ? "Supporting"
    : null;
}

export function buildWorkstreamView(
  project: DeliveryPipelineProject,
  workstream: WorkstreamIdentity,
) {
  const items: Array<{
    key: string;
    id: string;
    kind: "Work Item" | "Shared Capability";
    name: string;
    code: string;
    status: string;
    progress: number;
    dueDate: Date | null;
    blocker: string | null;
    riskLevel: string;
    deliveryStage: string;
    assignment: Assignment;
    milestoneNames: string[];
  }> = [];

  for (const milestone of project.milestones) {
    for (const entry of milestone.workItems) {
      const assignment = assignmentFor(entry, workstream.id);
      if (!assignment) continue;
      items.push({
        key: `work-item:${entry.id}`,
        id: entry.id,
        kind: "Work Item",
        name: entry.name,
        code: entry.code,
        status: entry.status,
        progress: entry.progress,
        dueDate: entry.dueDate,
        blocker: entry.blocker,
        riskLevel: entry.riskLevel,
        deliveryStage: entry.deliveryStage,
        assignment,
        milestoneNames: [milestone.name],
      });
    }
  }

  for (const entry of project.sharedCapabilities) {
    const assignment = assignmentFor(entry, workstream.id);
    if (!assignment) continue;
    items.push({
      key: `shared-capability:${entry.id}`,
      id: entry.id,
      kind: "Shared Capability",
      name: entry.name,
      code: entry.code,
      status: entry.status,
      progress: entry.progress,
      dueDate: entry.dueDate,
      blocker: entry.blocker,
      riskLevel: entry.riskLevel,
      deliveryStage: entry.deliveryStage,
      assignment,
      milestoneNames: project.milestones
        .filter(({ sharedCapabilityLinks }) =>
          sharedCapabilityLinks.some(({ sharedCapability }) => sharedCapability.id === entry.id),
        )
        .map(({ name }) => name),
    });
  }

  const uniqueItems = [...new Map(items.map((entry) => [entry.key, entry])).values()];
  const blockers = uniqueItems
    .filter(({ blocker, status }) => Boolean(blocker) || status === "BLOCKED")
    .sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));

  return {
    project: { id: project.id, code: project.code, name: project.name },
    workstream,
    items: uniqueItems,
    metrics: {
      unique: uniqueItems.length,
      primary: uniqueItems.filter(({ assignment }) => assignment === "Primary").length,
      supporting: uniqueItems.filter(({ assignment }) => assignment === "Supporting").length,
      completed: uniqueItems.filter(({ status }) => status === "COMPLETED").length,
      inProgress: uniqueItems.filter(({ status }) => ["IN_PROGRESS", "AT_RISK"].includes(status)).length,
      blocked: blockers.length,
      pending: uniqueItems.filter(({ status }) => status === "NOT_STARTED").length,
      averageProgress: uniqueItems.length
        ? Math.round(uniqueItems.reduce((sum, entry) => sum + entry.progress, 0) / uniqueItems.length)
        : 0,
    },
    upcomingDueItems: uniqueItems
      .filter(({ dueDate, status }) => dueDate && !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status))
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
      .slice(0, 6),
    relatedMilestones: [...new Set(uniqueItems.flatMap(({ milestoneNames }) => milestoneNames))].sort(),
    blockers,
  };
}

export type WorkstreamView = ReturnType<typeof buildWorkstreamView>;
