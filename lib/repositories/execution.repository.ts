import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

export class ExecutionRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  async refreshMilestoneSchedule(milestoneId: string) {
    const milestone = await this.database.milestone.findFirst({
      where: { id: milestoneId, archivedAt: null },
      select: {
        id: true,
        workItems: {
          where: { archivedAt: null },
          select: {
            startDate: true,
            dueDate: true,
          },
        },
        sharedCapabilityLinks: {
          where: {
            sharedCapability: {
              is: { archivedAt: null },
            },
          },
          select: {
            sharedCapability: {
              select: {
                startDate: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return null;
    }

    const scheduleDates = [
      ...milestone.workItems.map(({ startDate, dueDate }) => ({
        startDate,
        dueDate,
      })),
      ...milestone.sharedCapabilityLinks.map(({ sharedCapability }) => ({
        startDate: sharedCapability.startDate,
        dueDate: sharedCapability.dueDate,
      })),
    ];

    const startDates = scheduleDates
      .map(({ startDate }) => startDate)
      .filter((date): date is Date => Boolean(date));
    const dueDates = scheduleDates
      .map(({ dueDate }) => dueDate)
      .filter((date): date is Date => Boolean(date));

    const startDate = startDates.length
      ? new Date(Math.min(...startDates.map((date) => date.getTime())))
      : null;
    const dueDate = dueDates.length
      ? new Date(Math.max(...dueDates.map((date) => date.getTime())))
      : null;

    return this.database.milestone.update({
      where: { id: milestoneId },
      data: { startDate, dueDate },
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        startDate: true,
        dueDate: true,
      },
    });
  }

  findProject(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: { id: true, name: true, code: true },
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
      select: { id: true, projectId: true, name: true, code: true },
    });
  }

  listWorkItemCodes(milestoneId: string) {
    return this.database.workItem.findMany({
      where: { milestoneId },
      select: { code: true },
    });
  }

  listCapabilityCodes(projectId: string) {
    return this.database.sharedCapability.findMany({
      where: { projectId },
      select: { code: true },
    });
  }

  listSetup(projectId: string) {
    return Promise.all([
      this.database.workstream.findMany({
        where: { projectId, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, code: true, name: true, colorToken: true },
      }),
      this.database.projectMember.findMany({
        where: {
          projectId,
          archivedAt: null,
          user: { is: { isActive: true, archivedAt: null } },
        },
        orderBy: { user: { displayName: "asc" } },
        select: {
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      this.database.milestone.findMany({
        where: { projectId, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, code: true, name: true },
      }),
    ]);
  }

  countWorkstreams(projectId: string, workstreamIds: string[]) {
    return this.database.workstream.count({
      where: { id: { in: workstreamIds }, projectId, archivedAt: null },
    });
  }

  findActiveMember(projectId: string, userId: string) {
    return this.database.projectMember.findFirst({
      where: {
        projectId,
        userId,
        archivedAt: null,
        user: { is: { isActive: true, archivedAt: null } },
      },
      select: { userId: true },
    });
  }

  countMilestones(projectId: string, milestoneIds: string[]) {
    return this.database.milestone.count({
      where: { id: { in: milestoneIds }, projectId, archivedAt: null },
    });
  }

  findWorkItem(projectId: string, milestoneId: string, workItemId: string) {
    return this.database.workItem.findFirst({
      where: {
        id: workItemId,
        milestoneId,
        archivedAt: null,
        milestone: {
          is: {
            projectId,
            archivedAt: null,
            project: { is: { archivedAt: null } },
          },
        },
      },
      select: {
        id: true,
        milestoneId: true,
        primaryWorkstreamId: true,
        ownerId: true,
        code: true,
        name: true,
        description: true,
        acceptanceCriteria: true,
        notes: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        startDate: true,
        dueDate: true,
        nextGate: true,
        blocker: true,
        supportingWorkstreams: {
          select: { workstreamId: true },
          orderBy: { workstream: { code: "asc" } },
        },
        primaryWorkstream: {
          select: { id: true, code: true, name: true },
        },
        owner: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  findProjectWorkItem(projectId: string, workItemId: string) {
    return this.database.workItem.findFirst({
      where: {
        id: workItemId,
        archivedAt: null,
        milestone: {
          is: {
            projectId,
            archivedAt: null,
            project: { is: { archivedAt: null } },
          },
        },
      },
      select: {
        id: true,
        milestoneId: true,
        primaryWorkstreamId: true,
        ownerId: true,
        code: true,
        name: true,
        description: true,
        acceptanceCriteria: true,
        notes: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        startDate: true,
        dueDate: true,
        nextGate: true,
        blocker: true,
        supportingWorkstreams: {
          select: { workstreamId: true },
          orderBy: { workstream: { code: "asc" } },
        },
        primaryWorkstream: {
          select: { id: true, code: true, name: true },
        },
        owner: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  findWorkItemIdentity(workItemId: string) {
    return this.database.workItem.findFirst({
      where: {
        id: workItemId,
        archivedAt: null,
        milestone: {
          is: { archivedAt: null, project: { is: { archivedAt: null } } },
        },
      },
      select: {
        id: true,
        milestoneId: true,
        ownerId: true,
        milestone: { select: { projectId: true } },
      },
    });
  }

  createWorkItem(data: Prisma.WorkItemUncheckedCreateInput) {
    return this.database.workItem.create({
      data,
      select: {
        id: true,
        milestoneId: true,
        code: true,
        name: true,
        ownerId: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        primaryWorkstreamId: true,
      },
    });
  }

  updateWorkItem(
    workItemId: string,
    data: Prisma.WorkItemUncheckedUpdateInput,
  ) {
    return this.database.workItem.update({
      where: { id: workItemId },
      data,
      select: {
        id: true,
        milestoneId: true,
        code: true,
        name: true,
        ownerId: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        primaryWorkstreamId: true,
      },
    });
  }

  async replaceWorkItemSupporting(
    workItemId: string,
    workstreamIds: string[],
  ) {
    await this.database.workItemWorkstream.deleteMany({ where: { workItemId } });
    if (workstreamIds.length) {
      await this.database.workItemWorkstream.createMany({
        data: workstreamIds.map((workstreamId) => ({
          workItemId,
          workstreamId,
        })),
      });
    }
  }

  findCapability(projectId: string, sharedCapabilityId: string) {
    return this.database.sharedCapability.findFirst({
      where: {
        id: sharedCapabilityId,
        projectId,
        archivedAt: null,
        project: { is: { archivedAt: null } },
      },
      select: {
        id: true,
        projectId: true,
        primaryWorkstreamId: true,
        ownerId: true,
        code: true,
        name: true,
        description: true,
        acceptanceCriteria: true,
        notes: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        startDate: true,
        dueDate: true,
        nextGate: true,
        blocker: true,
        primaryWorkstream: {
          select: { id: true, code: true, name: true },
        },
        owner: { select: { id: true, displayName: true, email: true } },
        supportingWorkstreams: {
          select: { workstreamId: true },
          orderBy: { workstream: { code: "asc" } },
        },
        milestoneLinks: {
          orderBy: { milestone: { sortOrder: "asc" } },
          select: {
            milestoneId: true,
            sourceReference: true,
            dependencyNotes: true,
            isCritical: true,
            milestone: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  findCapabilityIdentity(sharedCapabilityId: string) {
    return this.database.sharedCapability.findFirst({
      where: {
        id: sharedCapabilityId,
        archivedAt: null,
        project: { is: { archivedAt: null } },
      },
      select: { id: true, projectId: true, ownerId: true },
    });
  }

  listCapabilities(projectId: string) {
    return this.database.sharedCapability.findMany({
      where: { projectId, archivedAt: null },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        blocker: true,
        nextGate: true,
        dueDate: true,
        owner: { select: { id: true, displayName: true } },
        primaryWorkstream: {
          select: { id: true, code: true, name: true },
        },
        supportingWorkstreams: {
          orderBy: { workstream: { code: "asc" } },
          select: {
            workstream: { select: { id: true, code: true, name: true } },
          },
        },
        milestoneLinks: {
          orderBy: { milestone: { sortOrder: "asc" } },
          select: {
            milestoneId: true,
            sourceReference: true,
            dependencyNotes: true,
            isCritical: true,
            milestone: { select: { code: true, name: true } },
          },
        },
      },
    });
  }

  createCapability(data: Prisma.SharedCapabilityUncheckedCreateInput) {
    return this.database.sharedCapability.create({
      data,
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        ownerId: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        primaryWorkstreamId: true,
      },
    });
  }

  updateCapability(
    sharedCapabilityId: string,
    data: Prisma.SharedCapabilityUncheckedUpdateInput,
  ) {
    return this.database.sharedCapability.update({
      where: { id: sharedCapabilityId },
      data,
      select: {
        id: true,
        projectId: true,
        code: true,
        name: true,
        ownerId: true,
        status: true,
        progress: true,
        riskLevel: true,
        deliveryStage: true,
        primaryWorkstreamId: true,
      },
    });
  }

  async replaceCapabilitySupporting(
    sharedCapabilityId: string,
    workstreamIds: string[],
  ) {
    await this.database.sharedCapabilityWorkstream.deleteMany({
      where: { sharedCapabilityId },
    });
    if (workstreamIds.length) {
      await this.database.sharedCapabilityWorkstream.createMany({
        data: workstreamIds.map((workstreamId) => ({
          sharedCapabilityId,
          workstreamId,
        })),
      });
    }
  }

  async replaceCapabilityLinks(
    projectId: string,
    sharedCapabilityId: string,
    links: Array<{
      milestoneId: string;
      sourceReference: string | null;
      dependencyNotes: string | null;
      isCritical: boolean;
    }>,
  ) {
    await this.database.milestoneSharedCapability.deleteMany({
      where: { sharedCapabilityId },
    });
    await this.database.milestoneSharedCapability.createMany({
      data: links.map((link) => ({
        projectId,
        sharedCapabilityId,
        ...link,
      })),
    });
  }

  recordStageChange(data: Prisma.DeliveryStageHistoryUncheckedCreateInput) {
    return this.database.deliveryStageHistory.create({ data });
  }
}
