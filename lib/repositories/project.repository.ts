import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

export class ProjectRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  listProjects(userId: string, isAdministrator: boolean) {
    return this.database.project.findMany({
      where: {
        archivedAt: null,
        ...(isAdministrator
          ? {}
          : {
              isPrivate: false,
              members: {
                some: { userId, archivedAt: null },
              },
            }),
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        isPrivate: true,
        projectType: true,
        projectGroup: {
          select: {
            id: true,
            name: true,
            colorToken: true,
            sortOrder: true,
          },
        },
        startDate: true,
        targetDate: true,
        updatedAt: true,
        _count: {
          select: {
            milestones: { where: { archivedAt: null } },
            members: {
              where: {
                archivedAt: null,
                user: { isActive: true, archivedAt: null },
              },
            },
          },
        },
      },
    });
  }

  findProjectDetails(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: {
        id: true,
        code: true,
        slug: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        isPrivate: true,
        projectType: true,
        startDate: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sharedCapabilities: { where: { archivedAt: null } },
          },
        },
        milestones: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
            businessPurpose: true,
            status: true,
            progress: true,
            riskLevel: true,
            deliveryStage: true,
            releaseHorizon: true,
            sortOrder: true,
            startDate: true,
            dueDate: true,
            deliveredScope: true,
            remainingScope: true,
            currentBlockers: true,
            nextAction: true,
            firstReleaseImpact: true,
            updatedAt: true,
            workItems: {
              where: { archivedAt: null },
              orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
                progress: true,
                riskLevel: true,
                deliveryStage: true,
                nextGate: true,
                startDate: true,
                dueDate: true,
                blocker: true,
                owner: { select: { id: true, displayName: true } },
                primaryWorkstream: {
                  select: { id: true, code: true, name: true },
                },
                supportingWorkstreams: {
                  orderBy: { workstream: { code: "asc" } },
                  select: {
                    workstream: {
                      select: { id: true, code: true, name: true },
                    },
                  },
                },
              },
            },
            sharedCapabilityLinks: {
              where: { sharedCapability: { archivedAt: null } },
              orderBy: { sharedCapability: { name: "asc" } },
              select: {
                sourceReference: true,
                dependencyNotes: true,
                isCritical: true,
                sharedCapability: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    status: true,
                    progress: true,
                    deliveryStage: true,
                    blocker: true,
                    owner: {
                      select: { id: true, displayName: true },
                    },
                    primaryWorkstream: {
                      select: { id: true, code: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          orderBy: [{ name: "asc" }, { code: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            progress: true,
            riskLevel: true,
            deliveryStage: true,
            dueDate: true,
            nextGate: true,
            blocker: true,
            primaryWorkstream: {
              select: { id: true, code: true, name: true },
            },
            supportingWorkstreams: {
              orderBy: { workstream: { code: "asc" } },
              select: {
                workstream: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
        members: {
          where: { archivedAt: null },
          orderBy: [{ role: "asc" }, { user: { displayName: "asc" } }],
          select: {
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                isActive: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            metadata: true,
            createdAt: true,
            actor: {
              select: { id: true, displayName: true, email: true },
            },
          },
        },
      },
    });
  }

  findProject(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: {
        id: true,
        code: true,
        slug: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        isPrivate: true,
        projectType: true,
        startDate: true,
        targetDate: true,
      },
    });
  }

  listProjectCodes() {
    return this.database.project.findMany({
      select: { code: true },
    });
  }

  createWorkstreams(data: Prisma.WorkstreamCreateManyInput[]) {
    return this.database.workstream.createMany({ data });
  }

  createProject(data: Prisma.ProjectCreateInput) {
    return this.database.project.create({
      data,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        isPrivate: true,
        projectType: true,
        startDate: true,
        targetDate: true,
      },
    });
  }

  updateProject(projectId: string, data: Prisma.ProjectUpdateInput) {
    return this.database.project.update({
      where: { id: projectId },
      data,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        isPrivate: true,
        projectType: true,
        startDate: true,
        targetDate: true,
      },
    });
  }

  findMilestone(projectId: string, milestoneId: string) {
    return this.database.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
        archivedAt: null,
        project: { is: { archivedAt: null } },
      },
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        businessPurpose: true,
        status: true,
        progress: true,
        riskLevel: true,
        releaseHorizon: true,
        sortOrder: true,
        startDate: true,
        dueDate: true,
        deliveredScope: true,
        remainingScope: true,
        currentBlockers: true,
        nextAction: true,
        firstReleaseImpact: true,
      },
    });
  }

  listMilestoneOrder(projectId: string) {
    return this.database.milestone.findMany({
      where: { projectId, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, sortOrder: true },
    });
  }

  listMilestoneCodes(projectId: string) {
    return this.database.milestone.findMany({
      where: { projectId },
      select: { code: true },
    });
  }

  maxMilestoneOrder(projectId: string) {
    return this.database.milestone.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
  }

  createMilestone(data: Prisma.MilestoneUncheckedCreateInput) {
    return this.database.milestone.create({
      data,
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        riskLevel: true,
        releaseHorizon: true,
        sortOrder: true,
      },
    });
  }

  updateMilestone(
    milestoneId: string,
    data: Prisma.MilestoneUncheckedUpdateInput,
  ) {
    return this.database.milestone.update({
      where: { id: milestoneId },
      data,
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        riskLevel: true,
        releaseHorizon: true,
        sortOrder: true,
      },
    });
  }

  findMembership(projectId: string, userId: string) {
    return this.database.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true, archivedAt: true },
    });
  }

  setMembership(
    projectId: string,
    userId: string,
    role: "PROJECT_MANAGER" | "TECHNICAL_LEAD" | "REVIEWER" | "VIEWER",
  ) {
    return this.database.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role },
      update: { role, archivedAt: null },
      select: { projectId: true, userId: true, role: true },
    });
  }

  archiveMembership(projectId: string, userId: string, archivedAt: Date) {
    return this.database.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { archivedAt },
      select: { projectId: true, userId: true, role: true },
    });
  }

  countProjectManagers(projectId: string) {
    return this.database.projectMember.count({
      where: {
        projectId,
        role: "PROJECT_MANAGER",
        archivedAt: null,
      },
    });
  }

  listAvailableUsers() {
    return this.database.user.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: [{ displayName: "asc" }, { email: "asc" }],
      select: { id: true, displayName: true, email: true },
    });
  }

  findAvailableUser(userId: string) {
    return this.database.user.findFirst({
      where: { id: userId, isActive: true, archivedAt: null },
      select: { id: true, displayName: true, email: true },
    });
  }
}

export type ProjectListItem = Awaited<
  ReturnType<ProjectRepository["listProjects"]>
>[number];

export type ProjectDetails = NonNullable<
  Awaited<ReturnType<ProjectRepository["findProjectDetails"]>>
>;
