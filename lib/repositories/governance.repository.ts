import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

const riskSelection = {
  id: true,
  projectId: true,
  milestoneId: true,
  workItemId: true,
  sharedCapabilityId: true,
  primaryWorkstreamId: true,
  ownerId: true,
  title: true,
  description: true,
  probability: true,
  impact: true,
  severity: true,
  status: true,
  mitigation: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  milestone: { select: { id: true, code: true, name: true } },
  workItem: { select: { id: true, code: true, name: true } },
  sharedCapability: { select: { id: true, code: true, name: true } },
  primaryWorkstream: { select: { id: true, code: true, name: true } },
  owner: { select: { id: true, displayName: true, email: true } },
} satisfies Prisma.RiskSelect;

const decisionSelection = {
  id: true,
  projectId: true,
  milestoneId: true,
  ownerId: true,
  title: true,
  description: true,
  requiredBy: true,
  recommendedDirection: true,
  status: true,
  decisionText: true,
  decidedAt: true,
  createdAt: true,
  updatedAt: true,
  milestone: { select: { id: true, code: true, name: true } },
  owner: { select: { id: true, displayName: true, email: true } },
  affectedWorkstreams: {
    orderBy: { workstream: { code: "asc" as const } },
    select: {
      workstreamId: true,
      workstream: { select: { id: true, code: true, name: true } },
    },
  },
  comments: {
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, displayName: true } },
    },
  },
} satisfies Prisma.DecisionSelect;

export class GovernanceRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  findProject(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: { id: true, code: true, name: true },
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
          user: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.database.milestone.findMany({
        where: { projectId, archivedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, code: true, name: true },
      }),
      this.database.workItem.findMany({
        where: {
          archivedAt: null,
          milestone: { is: { projectId, archivedAt: null } },
        },
        orderBy: [{ milestone: { sortOrder: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          milestoneId: true,
          milestone: { select: { code: true, name: true } },
        },
      }),
      this.database.sharedCapability.findMany({
        where: { projectId, archivedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true },
      }),
    ]);
  }

  listRisks(projectId: string) {
    return this.database.risk.findMany({
      where: { projectId, archivedAt: null },
      orderBy: [
        { severity: "desc" },
        { dueDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      select: riskSelection,
    });
  }

  findRisk(projectId: string, riskId: string) {
    return this.database.risk.findFirst({
      where: { id: riskId, projectId, archivedAt: null },
      select: riskSelection,
    });
  }

  createRisk(data: Prisma.RiskUncheckedCreateInput) {
    return this.database.risk.create({ data, select: riskSelection });
  }

  updateRisk(riskId: string, data: Prisma.RiskUncheckedUpdateInput) {
    return this.database.risk.update({
      where: { id: riskId },
      data,
      select: riskSelection,
    });
  }

  listDecisions(projectId: string) {
    return this.database.decision.findMany({
      where: { projectId, archivedAt: null },
      orderBy: [
        { requiredBy: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      select: decisionSelection,
    });
  }

  findDecision(projectId: string, decisionId: string) {
    return this.database.decision.findFirst({
      where: { id: decisionId, projectId, archivedAt: null },
      select: decisionSelection,
    });
  }

  createDecision(data: Prisma.DecisionUncheckedCreateInput) {
    return this.database.decision.create({ data, select: decisionSelection });
  }

  updateDecision(
    decisionId: string,
    data: Prisma.DecisionUncheckedUpdateInput,
  ) {
    return this.database.decision.update({
      where: { id: decisionId },
      data,
      select: decisionSelection,
    });
  }

  async replaceDecisionWorkstreams(
    decisionId: string,
    workstreamIds: string[],
  ) {
    await this.database.decisionWorkstream.deleteMany({ where: { decisionId } });
    await this.database.decisionWorkstream.createMany({
      data: workstreamIds.map((workstreamId) => ({
        decisionId,
        workstreamId,
      })),
    });
  }

  createDecisionComment(data: Prisma.CommentUncheckedCreateInput) {
    return this.database.comment.create({
      data,
      select: { id: true, body: true, createdAt: true },
    });
  }

  countWorkstreams(projectId: string, workstreamIds: string[]) {
    return this.database.workstream.count({
      where: { id: { in: workstreamIds }, projectId, archivedAt: null },
    });
  }

  findMilestone(projectId: string, milestoneId: string) {
    return this.database.milestone.findFirst({
      where: { id: milestoneId, projectId, archivedAt: null },
      select: { id: true, name: true },
    });
  }

  findWorkItem(projectId: string, workItemId: string) {
    return this.database.workItem.findFirst({
      where: {
        id: workItemId,
        archivedAt: null,
        milestone: { is: { projectId, archivedAt: null } },
      },
      select: { id: true, name: true, milestoneId: true },
    });
  }

  findCapability(projectId: string, sharedCapabilityId: string) {
    return this.database.sharedCapability.findFirst({
      where: { id: sharedCapabilityId, projectId, archivedAt: null },
      select: { id: true, name: true },
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

  listDecisionHistory(projectId: string, decisionId: string) {
    return this.database.auditLog.findMany({
      where: { projectId, entityType: "Decision", entityId: decisionId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        beforeState: true,
        afterState: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, displayName: true } },
      },
    });
  }
}

export type GovernanceRisk = NonNullable<
  Awaited<ReturnType<GovernanceRepository["findRisk"]>>
>;
export type GovernanceDecision = NonNullable<
  Awaited<ReturnType<GovernanceRepository["findDecision"]>>
>;
