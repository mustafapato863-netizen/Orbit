import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import { prisma } from "@/lib/prisma";
import type {
  CreateMilestoneInput,
  CreateMilestonePlanInput,
  CreateProjectInput,
  ReorderMilestoneInput,
  SetMembershipInput,
  UpdateMilestoneInput,
  UpdateProjectInput,
} from "@/lib/projects/project.schemas";
import { ExecutionService } from "@/lib/execution/execution.service";
import { nextSequenceCode } from "@/lib/projects/code-generation";
import {
  optionalDateValue,
  optionalTextValue,
  slugifyProject,
} from "@/lib/projects/project.utils";
import { ProjectRepository } from "@/lib/repositories/project.repository";
import { templateWorkstreams } from "@/lib/workstreams/workstream-templates";

export class ProjectDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "DUPLICATE"
      | "PRIVATE_VISIBILITY_REQUIRES_ADMIN"
      | "LAST_PROJECT_MANAGER"
      | "MEMBERSHIP_NOT_FOUND"
      | "USER_NOT_FOUND",
  ) {
    super(message);
    this.name = "ProjectDomainError";
  }
}

function projectState(project: {
  code: string;
  name: string;
  status: string;
  progress: number;
  isPrivate: boolean;
  projectType: string;
  startDate: Date | null;
  targetDate: Date | null;
}) {
  return {
    code: project.code,
    name: project.name,
    status: project.status,
    progress: project.progress,
    isPrivate: project.isPrivate,
    projectType: project.projectType,
    startDate: project.startDate?.toISOString().slice(0, 10) ?? null,
    targetDate: project.targetDate?.toISOString().slice(0, 10) ?? null,
  };
}

function milestoneState(milestone: {
  code: string;
  name: string;
  status: string;
  progress: number;
  riskLevel: string;
  releaseHorizon: string;
  sortOrder: number;
}) {
  return {
    code: milestone.code,
    name: milestone.name,
    status: milestone.status,
    progress: milestone.progress,
    riskLevel: milestone.riskLevel,
    releaseHorizon: milestone.releaseHorizon,
    sortOrder: milestone.sortOrder,
  };
}

function projectData(input: CreateProjectInput | UpdateProjectInput) {
  return {
    name: input.name.trim(),
    description: optionalTextValue(input.description),
    status: input.status,
    progress: input.progress,
    isPrivate: input.isPrivate,
    projectType: input.projectType ?? "CUSTOM",
    startDate: optionalDateValue(input.startDate),
    targetDate: optionalDateValue(input.targetDate),
  };
}

function milestoneData(
  input: CreateMilestoneInput | UpdateMilestoneInput,
) {
  return {
    name: input.name.trim(),
    businessPurpose: optionalTextValue(input.businessPurpose),
    status: input.status,
    progress: input.progress,
    riskLevel: input.riskLevel,
    releaseHorizon: input.releaseHorizon,
    startDate: optionalDateValue(input.startDate),
    dueDate: optionalDateValue(input.dueDate),
    deliveredScope: optionalTextValue(input.deliveredScope),
    remainingScope: optionalTextValue(input.remainingScope),
    currentBlockers: optionalTextValue(input.currentBlockers),
    nextAction: optionalTextValue(input.nextAction),
    firstReleaseImpact: optionalTextValue(input.firstReleaseImpact),
  };
}

export class ProjectService {
  private readonly repository: ProjectRepository;

  constructor(private readonly database: Prisma.TransactionClient) {
    this.repository = new ProjectRepository(database);
  }

  async createProject(
    actorId: string,
    input: CreateProjectInput,
    allowPrivate = false,
  ) {
    if (input.isPrivate && !allowPrivate) {
      throw new ProjectDomainError(
        "Only an Administrator can create an Administrator-only project.",
        "PRIVATE_VISIBILITY_REQUIRES_ADMIN",
      );
    }
    const projectCodes = await this.repository.listProjectCodes();
    const code = nextSequenceCode(
      "PRJ",
      projectCodes.map((project) => project.code),
    );
    const created = await this.repository.createProject({
      ...projectData(input),
      code,
      slug: slugifyProject(input.name, code),
    });
    const workstreams = templateWorkstreams(
      input.setupTemplate ?? input.projectType ?? "CUSTOM",
    );
    if (workstreams.length) {
      await this.repository.createWorkstreams(
        workstreams.map((workstream) => ({
          projectId: created.id,
          ...workstream,
        })),
      );
    }
    await this.repository.setMembership(
      created.id,
      actorId,
      "PROJECT_MANAGER",
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: created.id,
      action: "project.created",
      entityType: "Project",
      entityId: created.id,
      afterState: projectState(created),
    });

    return created;
  }

  async updateProject(
    actorId: string,
    input: UpdateProjectInput,
    allowPrivate = false,
  ) {
    const existing = await this.repository.findProject(input.projectId);
    if (!existing) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }
    if (input.isPrivate !== existing.isPrivate && !allowPrivate) {
      throw new ProjectDomainError(
        "Only an Administrator can change project visibility.",
        "PRIVATE_VISIBILITY_REQUIRES_ADMIN",
      );
    }

    const updated = await this.repository.updateProject(
      existing.id,
      projectData(input),
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: existing.id,
      action: "project.updated",
      entityType: "Project",
      entityId: existing.id,
      beforeState: projectState(existing),
      afterState: projectState(updated),
    });

    return updated;
  }

  async archiveProject(actorId: string, projectId: string) {
    const existing = await this.repository.findProject(projectId);
    if (!existing) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }

    const archivedAt = new Date();
    const archived = await this.repository.updateProject(projectId, {
      status: "ARCHIVED",
      archivedAt,
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "project.archived",
      entityType: "Project",
      entityId: projectId,
      beforeState: projectState(existing),
      afterState: {
        ...projectState(archived),
        archivedAt: archivedAt.toISOString(),
      },
    });
  }

  async createMilestone(actorId: string, input: CreateMilestoneInput) {
    if (!(await this.repository.findProject(input.projectId))) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }

    const [maximum, milestoneCodes] = await Promise.all([
      this.repository.maxMilestoneOrder(input.projectId),
      this.repository.listMilestoneCodes(input.projectId),
    ]);
    const code = nextSequenceCode(
      "MS",
      milestoneCodes.map((milestone) => milestone.code),
    );
    const created = await this.repository.createMilestone({
      projectId: input.projectId,
      ...milestoneData(input),
      code,
      sortOrder: (maximum._max.sortOrder ?? 0) + 10,
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "milestone.created",
      entityType: "Milestone",
      entityId: created.id,
      afterState: milestoneState(created),
      metadata: { milestoneName: created.name },
    });

    return created;
  }

  async createMilestonePlan(
    actorId: string,
    input: CreateMilestonePlanInput,
  ) {
    const project = await this.repository.findProject(input.projectId);
    if (!project) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }

    let primaryWorkstream = await this.database.workstream.findFirst({
      where: { projectId: input.projectId, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    if (!primaryWorkstream) {
      const workstreamCodes = await this.database.workstream.findMany({
        where: { projectId: input.projectId },
        select: { code: true },
      });
      const code = nextSequenceCode(
        "WS",
        workstreamCodes.map((workstream) => workstream.code),
      );
      primaryWorkstream = await this.database.workstream.create({
        data: {
          projectId: input.projectId,
          code,
          slug: `general-delivery-${code.toLowerCase()}`,
          name: "General Delivery",
          description:
            "Default delivery lane created automatically for milestone planning.",
          colorToken: "#64748b",
          iconKey: "layers",
          sortOrder: 10,
        },
        select: { id: true },
      });
    }

    const milestone = await this.createMilestone(actorId, {
      projectId: input.projectId,
      name: input.name,
      businessPurpose: "",
      status: "NOT_STARTED",
      progress: 0,
      riskLevel: "LOW",
      releaseHorizon: "RELEASE_1",
      startDate: "",
      dueDate: "",
      deliveredScope: "",
      remainingScope: "",
      currentBlockers: "",
      nextAction: "",
      firstReleaseImpact: "",
    });

    const execution = new ExecutionService(this.database);
    for (const subMilestone of input.subMilestones) {
      await execution.createWorkItem(actorId, {
        projectId: input.projectId,
        milestoneId: milestone.id,
        name: subMilestone.name,
        description: "",
        primaryWorkstreamId: primaryWorkstream.id,
        supportingWorkstreamIds: [],
        status: "NOT_STARTED",
        progress: 0,
        deliveryStage: "NOT_STARTED",
        nextGate: "",
        startDate: subMilestone.startDate,
        dueDate: subMilestone.dueDate,
        ownerId: "",
        riskLevel: "LOW",
        blocker: "",
        notes: "",
        acceptanceCriteria: "",
      });
    }

    return milestone;
  }

  async updateMilestone(actorId: string, input: UpdateMilestoneInput) {
    const existing = await this.repository.findMilestone(
      input.projectId,
      input.milestoneId,
    );
    if (!existing) {
      throw new ProjectDomainError("Milestone not found.", "NOT_FOUND");
    }

    const updated = await this.repository.updateMilestone(
      existing.id,
      milestoneData(input),
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "milestone.updated",
      entityType: "Milestone",
      entityId: existing.id,
      beforeState: milestoneState(existing),
      afterState: milestoneState(updated),
      metadata: { milestoneName: updated.name },
    });

    return updated;
  }

  async archiveMilestone(
    actorId: string,
    projectId: string,
    milestoneId: string,
  ) {
    const existing = await this.repository.findMilestone(
      projectId,
      milestoneId,
    );
    if (!existing) {
      throw new ProjectDomainError("Milestone not found.", "NOT_FOUND");
    }

    const archivedAt = new Date();
    const archived = await this.repository.updateMilestone(milestoneId, {
      status: "ARCHIVED",
      archivedAt,
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "milestone.archived",
      entityType: "Milestone",
      entityId: milestoneId,
      beforeState: milestoneState(existing),
      afterState: {
        ...milestoneState(archived),
        archivedAt: archivedAt.toISOString(),
      },
      metadata: { milestoneName: existing.name },
    });
  }

  async reorderMilestone(actorId: string, input: ReorderMilestoneInput) {
    if (!(await this.repository.findProject(input.projectId))) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }

    const milestones = await this.repository.listMilestoneOrder(
      input.projectId,
    );
    const currentIndex = milestones.findIndex(
      (milestone) => milestone.id === input.milestoneId,
    );
    const targetIndex =
      input.direction === "UP" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= milestones.length
    ) {
      return { changed: false };
    }

    [milestones[currentIndex], milestones[targetIndex]] = [
      milestones[targetIndex],
      milestones[currentIndex],
    ];

    for (const [index, milestone] of milestones.entries()) {
      await this.repository.updateMilestone(milestone.id, {
        sortOrder: (index + 1) * 10,
      });
    }

    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "milestone.reordered",
      entityType: "Milestone",
      entityId: input.milestoneId,
      metadata: {
        direction: input.direction,
        fromPosition: currentIndex + 1,
        toPosition: targetIndex + 1,
      },
    });

    return { changed: true };
  }

  async setMembership(actorId: string, input: SetMembershipInput) {
    const [project, user, existing] = await Promise.all([
      this.repository.findProject(input.projectId),
      this.repository.findAvailableUser(input.userId),
      this.repository.findMembership(input.projectId, input.userId),
    ]);

    if (!project) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }
    if (!user) {
      throw new ProjectDomainError(
        "The selected user is unavailable.",
        "USER_NOT_FOUND",
      );
    }
    if (
      existing?.role === "PROJECT_MANAGER" &&
      existing.archivedAt === null &&
      input.role !== "PROJECT_MANAGER" &&
      (await this.repository.countProjectManagers(input.projectId)) <= 1
    ) {
      throw new ProjectDomainError(
        "Every project must retain an active Project Manager.",
        "LAST_PROJECT_MANAGER",
      );
    }

    await this.repository.setMembership(
      input.projectId,
      input.userId,
      input.role,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "project.membership_set",
      entityType: "ProjectMember",
      entityId: `${input.projectId}:${input.userId}`,
      beforeState: existing
        ? { role: existing.role, archived: existing.archivedAt !== null }
        : { membership: null },
      afterState: { role: input.role, archived: false },
      metadata: { userDisplayName: user.displayName },
    });
  }

  async archiveMembership(
    actorId: string,
    projectId: string,
    userId: string,
  ) {
    const [project, existing] = await Promise.all([
      this.repository.findProject(projectId),
      this.repository.findMembership(projectId, userId),
    ]);
    if (!project) {
      throw new ProjectDomainError("Project not found.", "NOT_FOUND");
    }
    if (!existing || existing.archivedAt) {
      throw new ProjectDomainError(
        "Project membership not found.",
        "MEMBERSHIP_NOT_FOUND",
      );
    }
    if (
      existing.role === "PROJECT_MANAGER" &&
      (await this.repository.countProjectManagers(projectId)) <= 1
    ) {
      throw new ProjectDomainError(
        "Every project must retain an active Project Manager.",
        "LAST_PROJECT_MANAGER",
      );
    }

    await this.repository.archiveMembership(projectId, userId, new Date());
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "project.membership_archived",
      entityType: "ProjectMember",
      entityId: `${projectId}:${userId}`,
      beforeState: { role: existing.role, archived: false },
      afterState: { role: existing.role, archived: true },
    });
  }
}

async function transaction<T>(
  operation: (service: ProjectService) => Promise<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (database) => operation(new ProjectService(database)),
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;

      if (errorCode === "P2034" && attempt < 2) {
        continue;
      }
      if (errorCode === "P2002" && attempt < 2) {
        continue;
      }
      if (errorCode === "P2002") {
        throw new ProjectDomainError(
          "The next automatic reference could not be reserved. Please try again.",
          "DUPLICATE",
        );
      }
      throw error;
    }
  }

  throw new Error("Project transaction retry limit reached.");
}

export const projectCommands = {
  createProject: (
    actorId: string,
    input: CreateProjectInput,
    allowPrivate = false,
  ) => transaction((service) => service.createProject(actorId, input, allowPrivate)),
  updateProject: (
    actorId: string,
    input: UpdateProjectInput,
    allowPrivate = false,
  ) => transaction((service) => service.updateProject(actorId, input, allowPrivate)),
  archiveProject: (actorId: string, projectId: string) =>
    transaction((service) => service.archiveProject(actorId, projectId)),
  createMilestone: (actorId: string, input: CreateMilestoneInput) =>
    transaction((service) => service.createMilestone(actorId, input)),
  createMilestonePlan: (
    actorId: string,
    input: CreateMilestonePlanInput,
  ) => transaction((service) => service.createMilestonePlan(actorId, input)),
  updateMilestone: (actorId: string, input: UpdateMilestoneInput) =>
    transaction((service) => service.updateMilestone(actorId, input)),
  archiveMilestone: (
    actorId: string,
    projectId: string,
    milestoneId: string,
  ) =>
    transaction((service) =>
      service.archiveMilestone(actorId, projectId, milestoneId),
    ),
  reorderMilestone: (actorId: string, input: ReorderMilestoneInput) =>
    transaction((service) => service.reorderMilestone(actorId, input)),
  setMembership: (actorId: string, input: SetMembershipInput) =>
    transaction((service) => service.setMembership(actorId, input)),
  archiveMembership: (
    actorId: string,
    projectId: string,
    userId: string,
  ) =>
    transaction((service) =>
      service.archiveMembership(actorId, projectId, userId),
    ),
};

export const projectQueries = {
  listProjects: (userId: string, isAdministrator: boolean) =>
    new ProjectRepository(prisma).listProjects(userId, isAdministrator),
  getProjectDetails: (projectId: string) =>
    new ProjectRepository(prisma).findProjectDetails(projectId),
  getProject: (projectId: string) =>
    new ProjectRepository(prisma).findProject(projectId),
  getMilestone: (projectId: string, milestoneId: string) =>
    new ProjectRepository(prisma).findMilestone(projectId, milestoneId),
  listAvailableUsers: () =>
    new ProjectRepository(prisma).listAvailableUsers(),
};
