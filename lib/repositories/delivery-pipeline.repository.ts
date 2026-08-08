import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

const executionSelection = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  progress: true,
  riskLevel: true,
  deliveryStage: true,
  nextGate: true,
  startDate: true,
  dueDate: true,
  blocker: true,
  notes: true,
  acceptanceCriteria: true,
  primaryWorkstream: {
    select: { id: true, code: true, name: true },
  },
  supportingWorkstreams: {
    orderBy: { workstream: { code: "asc" as const } },
    select: {
      workstream: {
        select: { id: true, code: true, name: true },
      },
    },
  },
  owner: {
    select: { id: true, displayName: true, email: true },
  },
  deliveryStageHistory: {
    orderBy: { changedAt: "desc" as const },
    select: {
      id: true,
      fromStage: true,
      toStage: true,
      notes: true,
      changedAt: true,
      changedBy: {
        select: { id: true, displayName: true },
      },
    },
  },
  comments: {
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: { id: true, displayName: true },
      },
    },
  },
} satisfies Prisma.WorkItemSelect;

const capabilitySelection = {
  id: true,
  code: true,
  name: true,
  description: true,
  status: true,
  progress: true,
  riskLevel: true,
  deliveryStage: true,
  nextGate: true,
  startDate: true,
  dueDate: true,
  blocker: true,
  notes: true,
  acceptanceCriteria: true,
  primaryWorkstream: {
    select: { id: true, code: true, name: true },
  },
  supportingWorkstreams: {
    orderBy: { workstream: { code: "asc" as const } },
    select: {
      workstream: {
        select: { id: true, code: true, name: true },
      },
    },
  },
  owner: {
    select: { id: true, displayName: true, email: true },
  },
  deliveryStageHistory: {
    orderBy: { changedAt: "desc" as const },
    select: {
      id: true,
      fromStage: true,
      toStage: true,
      notes: true,
      changedAt: true,
      changedBy: {
        select: { id: true, displayName: true },
      },
    },
  },
  comments: {
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: {
        select: { id: true, displayName: true },
      },
    },
  },
} satisfies Prisma.SharedCapabilitySelect;

export class DeliveryPipelineRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  findProjectPipeline(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        startDate: true,
        targetDate: true,
        milestones: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            progress: true,
            riskLevel: true,
            deliveryStage: true,
            releaseHorizon: true,
            startDate: true,
            dueDate: true,
            workItems: {
              where: { archivedAt: null },
              orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
              select: executionSelection,
            },
            sharedCapabilityLinks: {
              where: { sharedCapability: { archivedAt: null } },
              orderBy: { sharedCapability: { name: "asc" } },
              select: {
                sourceReference: true,
                dependencyNotes: true,
                isCritical: true,
                sharedCapability: {
                  select: capabilitySelection,
                },
              },
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          orderBy: [{ name: "asc" }, { code: "asc" }],
          select: capabilitySelection,
        },
        members: {
          where: {
            archivedAt: null,
            user: { is: { isActive: true, archivedAt: null } },
          },
          orderBy: { user: { displayName: "asc" } },
          select: {
            user: {
              select: { id: true, displayName: true, email: true },
            },
          },
        },
      },
    });
  }
}

export type DeliveryPipelineProject = NonNullable<
  Awaited<
    ReturnType<DeliveryPipelineRepository["findProjectPipeline"]>
  >
>;
