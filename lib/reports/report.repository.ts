import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

const packageSelection = {
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
  acceptanceCriteria: true,
  owner: { select: { displayName: true } },
  primaryWorkstream: { select: { code: true, name: true } },
  supportingWorkstreams: {
    orderBy: { workstream: { code: "asc" as const } },
    select: { workstream: { select: { code: true, name: true } } },
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
  acceptanceCriteria: true,
  owner: { select: { displayName: true } },
  primaryWorkstream: { select: { code: true, name: true } },
  supportingWorkstreams: {
    orderBy: { workstream: { code: "asc" as const } },
    select: { workstream: { select: { code: true, name: true } } },
  },
  milestoneLinks: {
    orderBy: { milestone: { sortOrder: "asc" as const } },
    select: {
      sourceReference: true,
      dependencyNotes: true,
      isCritical: true,
      milestone: { select: { id: true, code: true, name: true } },
    },
  },
} satisfies Prisma.SharedCapabilitySelect;

export class ReportRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  findProjectSource(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        targetDate: true,
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
            workItems: {
              where: { archivedAt: null },
              orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { code: "asc" }],
              select: packageSelection,
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          orderBy: [{ name: "asc" }, { code: "asc" }],
          select: capabilitySelection,
        },
        risks: {
          where: { archivedAt: null },
          orderBy: [{ severity: "desc" }, { dueDate: { sort: "asc", nulls: "last" } }],
          select: {
            id: true,
            title: true,
            description: true,
            probability: true,
            impact: true,
            severity: true,
            status: true,
            mitigation: true,
            dueDate: true,
            owner: { select: { displayName: true } },
            milestone: { select: { code: true, name: true } },
            workItem: { select: { code: true, name: true } },
            sharedCapability: { select: { code: true, name: true } },
            primaryWorkstream: { select: { code: true, name: true } },
          },
        },
        decisions: {
          where: { archivedAt: null },
          orderBy: [{ requiredBy: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
          select: {
            id: true,
            title: true,
            description: true,
            requiredBy: true,
            recommendedDirection: true,
            status: true,
            decisionText: true,
            decidedAt: true,
            owner: { select: { displayName: true } },
            milestone: { select: { code: true, name: true } },
            affectedWorkstreams: {
              orderBy: { workstream: { code: "asc" } },
              select: { workstream: { select: { code: true, name: true } } },
            },
          },
        },
        pilotScope: {
          select: {
            id: true,
            name: true,
            knownLimitations: true,
            businessSignOffStatus: true,
            technicalSignOffStatus: true,
            finalDecisionStatus: true,
            finalDecision: true,
            supportOwner: { select: { displayName: true } },
            rollbackOwner: { select: { displayName: true } },
            teams: {
              where: { archivedAt: null },
              orderBy: { name: "asc" },
              select: {
                id: true,
                name: true,
                leadUser: { select: { displayName: true } },
                members: {
                  where: { archivedAt: null },
                  select: { user: { select: { displayName: true } } },
                },
              },
            },
            capabilities: {
              orderBy: [{ disposition: "asc" }, { sharedCapability: { name: "asc" } }],
              select: {
                disposition: true,
                notes: true,
                sharedCapability: { select: { id: true, code: true, name: true } },
              },
            },
            criteria: {
              orderBy: [{ type: "asc" }, { code: "asc" }],
              select: {
                id: true,
                code: true,
                type: true,
                title: true,
                isRequired: true,
                status: true,
                evidence: true,
              },
            },
            issues: {
              where: { archivedAt: null },
              orderBy: [{ isBlocking: "desc" }, { severity: "desc" }],
              select: {
                id: true,
                title: true,
                severity: true,
                status: true,
                isBlocking: true,
                dueDate: true,
                mitigation: true,
                owner: { select: { displayName: true } },
              },
            },
          },
        },
      },
    });
  }

  listSnapshots(projectId: string, take = 20) {
    return this.database.reportSnapshot.findMany({
      where: { projectId, archivedAt: null },
      orderBy: { generatedAt: "desc" },
      take,
      select: {
        id: true,
        reportType: true,
        version: true,
        title: true,
        generatedAt: true,
        parameters: true,
        generatedBy: { select: { displayName: true } },
      },
    });
  }

  async createSnapshot(data: {
    projectId: string;
    generatedById: string;
    reportType: string;
    title: string;
    parameters: Prisma.InputJsonValue;
    snapshot: Prisma.InputJsonValue;
  }) {
    const aggregate = await this.database.reportSnapshot.aggregate({
      where: { projectId: data.projectId, reportType: data.reportType },
      _max: { version: true },
    });
    return this.database.reportSnapshot.create({
      data: { ...data, version: (aggregate._max.version ?? 0) + 1 },
      select: { id: true, version: true, generatedAt: true },
    });
  }
}

export type ReportProjectSource = NonNullable<
  Awaited<ReturnType<ReportRepository["findProjectSource"]>>
>;
