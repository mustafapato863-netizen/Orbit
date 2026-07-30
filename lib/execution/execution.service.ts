import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import type {
  AssignedCapabilityExecutionInput,
  AssignedExecutionInput,
  CreateSharedCapabilityInput,
  CreateWorkItemInput,
  UpdateSharedCapabilityInput,
  UpdateWorkItemInput,
} from "@/lib/execution/execution.schemas";
import { prisma } from "@/lib/prisma";
import {
  optionalDateValue,
  optionalTextValue,
} from "@/lib/projects/project.utils";
import {
  nextChildCode,
  nextSequenceCode,
} from "@/lib/projects/code-generation";
import { ExecutionRepository } from "@/lib/repositories/execution.repository";

export class ExecutionDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "DUPLICATE"
      | "INVALID_WORKSTREAM"
      | "INVALID_OWNER"
      | "INVALID_MILESTONE"
      | "NOT_ASSIGNED",
  ) {
    super(message);
    this.name = "ExecutionDomainError";
  }
}

type FullExecutionInput =
  | CreateWorkItemInput
  | UpdateWorkItemInput
  | CreateSharedCapabilityInput
  | UpdateSharedCapabilityInput;

function executionData(input: FullExecutionInput) {
  return {
    name: input.name.trim(),
    description: optionalTextValue(input.description),
    primaryWorkstreamId: input.primaryWorkstreamId,
    ownerId: input.ownerId || null,
    acceptanceCriteria: optionalTextValue(input.acceptanceCriteria),
    notes: optionalTextValue(input.notes),
    status: input.status,
    progress: input.progress,
    riskLevel: input.riskLevel,
    deliveryStage: input.deliveryStage,
    startDate: optionalDateValue(input.startDate),
    dueDate: optionalDateValue(input.dueDate),
    nextGate: optionalTextValue(input.nextGate),
    blocker: optionalTextValue(input.blocker),
  };
}

function assignedData(
  input: AssignedExecutionInput | AssignedCapabilityExecutionInput,
) {
  return {
    status: input.status,
    progress: input.progress,
    deliveryStage: input.deliveryStage,
    nextGate: optionalTextValue(input.nextGate),
    riskLevel: input.riskLevel,
    blocker: optionalTextValue(input.blocker),
    notes: optionalTextValue(input.notes),
  };
}

function executionState(item: {
  code: string;
  name: string;
  ownerId: string | null;
  status: string;
  progress: number;
  riskLevel: string;
  deliveryStage: string;
  primaryWorkstreamId: string;
}) {
  return {
    code: item.code,
    name: item.name,
    ownerId: item.ownerId,
    status: item.status,
    progress: item.progress,
    riskLevel: item.riskLevel,
    deliveryStage: item.deliveryStage,
    primaryWorkstreamId: item.primaryWorkstreamId,
  };
}

export class ExecutionService {
  private readonly repository: ExecutionRepository;

  constructor(private readonly database: Prisma.TransactionClient) {
    this.repository = new ExecutionRepository(database);
  }

  private async validateRelations(
    projectId: string,
    primaryWorkstreamId: string,
    supportingWorkstreamIds: string[],
    ownerId: string,
  ) {
    if (!(await this.repository.findProject(projectId))) {
      throw new ExecutionDomainError("Project not found.", "NOT_FOUND");
    }

    const workstreamIds = [
      primaryWorkstreamId,
      ...supportingWorkstreamIds,
    ];
    if (
      (await this.repository.countWorkstreams(projectId, workstreamIds)) !==
      new Set(workstreamIds).size
    ) {
      throw new ExecutionDomainError(
        "One or more workstreams are unavailable.",
        "INVALID_WORKSTREAM",
      );
    }

    if (
      ownerId &&
      !(await this.repository.findActiveMember(projectId, ownerId))
    ) {
      throw new ExecutionDomainError(
        "The owner must be an active project member.",
        "INVALID_OWNER",
      );
    }
  }

  private async recordWorkItemStage(
    actorId: string,
    workItemId: string,
    fromStage: string | null,
    toStage: string,
  ) {
    if (fromStage === toStage) return;
    await this.repository.recordStageChange({
      workItemId,
      fromStage: fromStage as
        | "NOT_STARTED"
        | "IN_DEVELOPMENT"
        | "TECHNICAL_VERIFICATION"
        | "BUSINESS_UAT"
        | "STAGING"
        | "CONTROLLED_PILOT"
        | "PRODUCTION"
        | null,
      toStage: toStage as
        | "NOT_STARTED"
        | "IN_DEVELOPMENT"
        | "TECHNICAL_VERIFICATION"
        | "BUSINESS_UAT"
        | "STAGING"
        | "CONTROLLED_PILOT"
        | "PRODUCTION",
      changedById: actorId,
    });
  }

  private async recordCapabilityStage(
    actorId: string,
    sharedCapabilityId: string,
    fromStage: string | null,
    toStage: string,
  ) {
    if (fromStage === toStage) return;
    await this.repository.recordStageChange({
      sharedCapabilityId,
      fromStage: fromStage as
        | "NOT_STARTED"
        | "IN_DEVELOPMENT"
        | "TECHNICAL_VERIFICATION"
        | "BUSINESS_UAT"
        | "STAGING"
        | "CONTROLLED_PILOT"
        | "PRODUCTION"
        | null,
      toStage: toStage as
        | "NOT_STARTED"
        | "IN_DEVELOPMENT"
        | "TECHNICAL_VERIFICATION"
        | "BUSINESS_UAT"
        | "STAGING"
        | "CONTROLLED_PILOT"
        | "PRODUCTION",
      changedById: actorId,
    });
  }

  async createWorkItem(actorId: string, input: CreateWorkItemInput) {
    const milestone = await this.repository.findMilestone(
      input.projectId,
      input.milestoneId,
    );
    if (!milestone) {
      throw new ExecutionDomainError(
        "Milestone not found.",
        "INVALID_MILESTONE",
      );
    }
    await this.validateRelations(
      input.projectId,
      input.primaryWorkstreamId,
      input.supportingWorkstreamIds,
      input.ownerId,
    );

    const workItemCodes = await this.repository.listWorkItemCodes(
      input.milestoneId,
    );
    const code = nextChildCode(
      milestone.code,
      workItemCodes.map((item) => item.code),
    );
    const created = await this.repository.createWorkItem({
      milestoneId: input.milestoneId,
      ...executionData(input),
      code,
    });
    await this.repository.replaceWorkItemSupporting(
      created.id,
      input.supportingWorkstreamIds,
    );
    await this.recordWorkItemStage(
      actorId,
      created.id,
      null,
      created.deliveryStage,
    );
    await this.repository.refreshMilestoneSchedule(input.milestoneId);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "work_item.created",
      entityType: "WorkItem",
      entityId: created.id,
      afterState: executionState(created),
      metadata: { milestoneId: input.milestoneId, milestoneName: milestone.name },
    });

    return created;
  }

  async updateWorkItem(actorId: string, input: UpdateWorkItemInput) {
    const existing = await this.repository.findProjectWorkItem(
      input.projectId,
      input.workItemId,
    );
    if (!existing) {
      throw new ExecutionDomainError("Work Item not found.", "NOT_FOUND");
    }
    await this.validateRelations(
      input.projectId,
      input.primaryWorkstreamId,
      input.supportingWorkstreamIds,
      input.ownerId,
    );

    const updated = await this.repository.updateWorkItem(
      input.workItemId,
      executionData(input),
    );
    await this.repository.replaceWorkItemSupporting(
      updated.id,
      input.supportingWorkstreamIds,
    );
    await this.recordWorkItemStage(
      actorId,
      updated.id,
      existing.deliveryStage,
      updated.deliveryStage,
    );
    await this.repository.refreshMilestoneSchedule(existing.milestoneId);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "work_item.updated",
      entityType: "WorkItem",
      entityId: updated.id,
      beforeState: executionState(existing),
      afterState: executionState(updated),
      metadata: { milestoneId: existing.milestoneId },
    });

    return updated;
  }

  async updateAssignedWorkItem(
    actorId: string,
    input: AssignedExecutionInput,
  ) {
    const identity = await this.repository.findWorkItemIdentity(
      input.workItemId,
    );
    if (!identity) {
      throw new ExecutionDomainError("Work Item not found.", "NOT_FOUND");
    }
    if (identity.ownerId !== actorId) {
      throw new ExecutionDomainError(
        "The Work Item is not assigned to this user.",
        "NOT_ASSIGNED",
      );
    }
    const existing = await this.repository.findWorkItem(
      identity.milestone.projectId,
      identity.milestoneId,
      identity.id,
    );
    if (!existing) {
      throw new ExecutionDomainError("Work Item not found.", "NOT_FOUND");
    }

    const updated = await this.repository.updateWorkItem(
      identity.id,
      assignedData(input),
    );
    await this.recordWorkItemStage(
      actorId,
      updated.id,
      existing.deliveryStage,
      updated.deliveryStage,
    );
    await this.repository.refreshMilestoneSchedule(identity.milestoneId);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: identity.milestone.projectId,
      action: "work_item.execution_updated",
      entityType: "WorkItem",
      entityId: updated.id,
      beforeState: executionState(existing),
      afterState: executionState(updated),
      metadata: { milestoneId: identity.milestoneId },
    });
  }

  async archiveWorkItem(
    actorId: string,
    projectId: string,
    milestoneId: string,
    workItemId: string,
  ) {
    const existing = await this.repository.findWorkItem(
      projectId,
      milestoneId,
      workItemId,
    );
    if (!existing) {
      throw new ExecutionDomainError("Work Item not found.", "NOT_FOUND");
    }
    const archived = await this.repository.updateWorkItem(workItemId, {
      status: "ARCHIVED",
      archivedAt: new Date(),
    });
    await this.repository.refreshMilestoneSchedule(milestoneId);
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "work_item.archived",
      entityType: "WorkItem",
      entityId: workItemId,
      beforeState: executionState(existing),
      afterState: executionState(archived),
      metadata: { milestoneId },
    });
  }

  private async validateCapabilityLinks(
    projectId: string,
    links: CreateSharedCapabilityInput["milestoneLinks"],
  ) {
    const milestoneIds = links.map(({ milestoneId }) => milestoneId);
    if (
      (await this.repository.countMilestones(projectId, milestoneIds)) !==
      milestoneIds.length
    ) {
      throw new ExecutionDomainError(
        "One or more linked milestones are unavailable.",
        "INVALID_MILESTONE",
      );
    }
  }

  async createCapability(
    actorId: string,
    input: CreateSharedCapabilityInput,
  ) {
    await this.validateRelations(
      input.projectId,
      input.primaryWorkstreamId,
      input.supportingWorkstreamIds,
      input.ownerId,
    );
    await this.validateCapabilityLinks(input.projectId, input.milestoneLinks);

    const capabilityCodes = await this.repository.listCapabilityCodes(
      input.projectId,
    );
    const code = nextSequenceCode(
      "CAP",
      capabilityCodes.map((capability) => capability.code),
    );
    const created = await this.repository.createCapability({
      projectId: input.projectId,
      ...executionData(input),
      code,
    });
    await this.repository.replaceCapabilitySupporting(
      created.id,
      input.supportingWorkstreamIds,
    );
    await this.repository.replaceCapabilityLinks(
      input.projectId,
      created.id,
      input.milestoneLinks.map((link) => ({
        milestoneId: link.milestoneId,
        sourceReference: optionalTextValue(link.sourceReference),
        dependencyNotes: optionalTextValue(link.dependencyNotes),
        isCritical: link.isCritical,
      })),
    );
    for (const milestoneId of new Set(input.milestoneLinks.map(({ milestoneId }) => milestoneId))) {
      await this.repository.refreshMilestoneSchedule(milestoneId);
    }
    await this.recordCapabilityStage(
      actorId,
      created.id,
      null,
      created.deliveryStage,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "shared_capability.created",
      entityType: "SharedCapability",
      entityId: created.id,
      afterState: executionState(created),
      metadata: {
        linkedMilestoneIds: input.milestoneLinks.map(
          ({ milestoneId }) => milestoneId,
        ),
      },
    });

    return created;
  }

  async updateCapability(
    actorId: string,
    input: UpdateSharedCapabilityInput,
  ) {
    const existing = await this.repository.findCapability(
      input.projectId,
      input.sharedCapabilityId,
    );
    if (!existing) {
      throw new ExecutionDomainError(
        "Shared Capability not found.",
        "NOT_FOUND",
      );
    }
    await this.validateRelations(
      input.projectId,
      input.primaryWorkstreamId,
      input.supportingWorkstreamIds,
      input.ownerId,
    );
    await this.validateCapabilityLinks(input.projectId, input.milestoneLinks);

    const updated = await this.repository.updateCapability(
      input.sharedCapabilityId,
      executionData(input),
    );
    await this.repository.replaceCapabilitySupporting(
      updated.id,
      input.supportingWorkstreamIds,
    );
    await this.repository.replaceCapabilityLinks(
      input.projectId,
      updated.id,
      input.milestoneLinks.map((link) => ({
        milestoneId: link.milestoneId,
        sourceReference: optionalTextValue(link.sourceReference),
        dependencyNotes: optionalTextValue(link.dependencyNotes),
        isCritical: link.isCritical,
      })),
    );
    const linkedMilestoneIds = new Set([
      ...existing.milestoneLinks.map(({ milestoneId }) => milestoneId),
      ...input.milestoneLinks.map(({ milestoneId }) => milestoneId),
    ]);
    for (const milestoneId of linkedMilestoneIds) {
      await this.repository.refreshMilestoneSchedule(milestoneId);
    }
    await this.recordCapabilityStage(
      actorId,
      updated.id,
      existing.deliveryStage,
      updated.deliveryStage,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "shared_capability.updated",
      entityType: "SharedCapability",
      entityId: updated.id,
      beforeState: executionState(existing),
      afterState: executionState(updated),
      metadata: {
        linkedMilestoneIds: input.milestoneLinks.map(
          ({ milestoneId }) => milestoneId,
        ),
      },
    });

    return updated;
  }

  async updateAssignedCapability(
    actorId: string,
    input: AssignedCapabilityExecutionInput,
  ) {
    const identity = await this.repository.findCapabilityIdentity(
      input.sharedCapabilityId,
    );
    if (!identity) {
      throw new ExecutionDomainError(
        "Shared Capability not found.",
        "NOT_FOUND",
      );
    }
    if (identity.ownerId !== actorId) {
      throw new ExecutionDomainError(
        "The Shared Capability is not assigned to this user.",
        "NOT_ASSIGNED",
      );
    }
    const existing = await this.repository.findCapability(
      identity.projectId,
      identity.id,
    );
    if (!existing) {
      throw new ExecutionDomainError(
        "Shared Capability not found.",
        "NOT_FOUND",
      );
    }

    const updated = await this.repository.updateCapability(
      identity.id,
      assignedData(input),
    );
    await this.refreshLinkedMilestones(identity.id);
    await this.recordCapabilityStage(
      actorId,
      updated.id,
      existing.deliveryStage,
      updated.deliveryStage,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: identity.projectId,
      action: "shared_capability.execution_updated",
      entityType: "SharedCapability",
      entityId: updated.id,
      beforeState: executionState(existing),
      afterState: executionState(updated),
    });
  }

  async archiveCapability(
    actorId: string,
    projectId: string,
    sharedCapabilityId: string,
  ) {
    const existing = await this.repository.findCapability(
      projectId,
      sharedCapabilityId,
    );
    if (!existing) {
      throw new ExecutionDomainError(
        "Shared Capability not found.",
        "NOT_FOUND",
      );
    }
    const archived = await this.repository.updateCapability(
      sharedCapabilityId,
      { status: "ARCHIVED", archivedAt: new Date() },
    );
    await this.refreshLinkedMilestones(sharedCapabilityId);
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "shared_capability.archived",
      entityType: "SharedCapability",
      entityId: sharedCapabilityId,
      beforeState: executionState(existing),
      afterState: executionState(archived),
    });
  }

  private async refreshLinkedMilestones(sharedCapabilityId: string) {
    const linkedMilestones = await this.database.milestoneSharedCapability.findMany({
      where: { sharedCapabilityId },
      select: { milestoneId: true },
    });
    for (const { milestoneId } of linkedMilestones) {
      await this.repository.refreshMilestoneSchedule(milestoneId);
    }
  }
}

async function transaction<T>(
  operation: (service: ExecutionService) => Promise<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (database) => operation(new ExecutionService(database)),
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;
      if (code === "P2034" && attempt < 2) continue;
      if (code === "P2002" && attempt < 2) continue;
      if (code === "P2002") {
        throw new ExecutionDomainError(
          "A record with that code or canonical name already exists.",
          "DUPLICATE",
        );
      }
      throw error;
    }
  }
  throw new Error("Execution transaction retry limit reached.");
}

export const executionCommands = {
  createWorkItem: (actorId: string, input: CreateWorkItemInput) =>
    transaction((service) => service.createWorkItem(actorId, input)),
  updateWorkItem: (actorId: string, input: UpdateWorkItemInput) =>
    transaction((service) => service.updateWorkItem(actorId, input)),
  updateAssignedWorkItem: (actorId: string, input: AssignedExecutionInput) =>
    transaction((service) => service.updateAssignedWorkItem(actorId, input)),
  archiveWorkItem: (
    actorId: string,
    projectId: string,
    milestoneId: string,
    workItemId: string,
  ) =>
    transaction((service) =>
      service.archiveWorkItem(actorId, projectId, milestoneId, workItemId),
    ),
  createCapability: (
    actorId: string,
    input: CreateSharedCapabilityInput,
  ) => transaction((service) => service.createCapability(actorId, input)),
  updateCapability: (
    actorId: string,
    input: UpdateSharedCapabilityInput,
  ) => transaction((service) => service.updateCapability(actorId, input)),
  updateAssignedCapability: (
    actorId: string,
    input: AssignedCapabilityExecutionInput,
  ) =>
    transaction((service) =>
      service.updateAssignedCapability(actorId, input),
    ),
  archiveCapability: (
    actorId: string,
    projectId: string,
    sharedCapabilityId: string,
  ) =>
    transaction((service) =>
      service.archiveCapability(actorId, projectId, sharedCapabilityId),
    ),
};

export const executionQueries = {
  getSetup: (projectId: string) =>
    new ExecutionRepository(prisma).listSetup(projectId),
  getWorkItem: (
    projectId: string,
    milestoneId: string,
    workItemId: string,
  ) =>
    new ExecutionRepository(prisma).findWorkItem(
      projectId,
      milestoneId,
      workItemId,
    ),
  listCapabilities: (projectId: string) =>
    new ExecutionRepository(prisma).listCapabilities(projectId),
  getCapability: (projectId: string, sharedCapabilityId: string) =>
    new ExecutionRepository(prisma).findCapability(
      projectId,
      sharedCapabilityId,
    ),
};
