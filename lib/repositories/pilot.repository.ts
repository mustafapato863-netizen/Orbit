import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

const pilotScopeSelection = {
  id: true,
  projectId: true,
  name: true,
  knownLimitations: true,
  supportOwnerId: true,
  rollbackOwnerId: true,
  businessSignOffById: true,
  technicalSignOffById: true,
  businessSignOffStatus: true,
  technicalSignOffStatus: true,
  finalDecisionStatus: true,
  finalDecision: true,
  businessSignedOffAt: true,
  technicalSignedOffAt: true,
  createdAt: true,
  updatedAt: true,
  supportOwner: { select: { id: true, displayName: true, email: true } },
  rollbackOwner: { select: { id: true, displayName: true, email: true } },
  businessSignOffBy: { select: { id: true, displayName: true } },
  technicalSignOffBy: { select: { id: true, displayName: true } },
  teams: {
    where: { archivedAt: null },
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      name: true,
      description: true,
      leadUserId: true,
      leadUser: { select: { id: true, displayName: true, email: true } },
      members: {
        where: { archivedAt: null },
        orderBy: { user: { displayName: "asc" as const } },
        select: {
          userId: true,
          user: { select: { id: true, displayName: true, email: true } },
        },
      },
    },
  },
  criteria: {
    orderBy: [{ type: "asc" as const }, { code: "asc" as const }],
    select: {
      id: true,
      code: true,
      type: true,
      title: true,
      description: true,
      isRequired: true,
      status: true,
      evidence: true,
      reviewerId: true,
      reviewedAt: true,
      reviewer: { select: { id: true, displayName: true } },
    },
  },
  capabilities: {
    orderBy: [
      { disposition: "asc" as const },
      { sharedCapability: { name: "asc" as const } },
    ],
    select: {
      sharedCapabilityId: true,
      disposition: true,
      notes: true,
      sharedCapability: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          progress: true,
          deliveryStage: true,
          riskLevel: true,
        },
      },
    },
  },
  issues: {
    where: { archivedAt: null },
    orderBy: [
      { isBlocking: "desc" as const },
      { severity: "desc" as const },
      { dueDate: { sort: "asc" as const, nulls: "last" as const } },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      status: true,
      isBlocking: true,
      mitigation: true,
      dueDate: true,
      resolvedAt: true,
      ownerId: true,
      owner: { select: { id: true, displayName: true, email: true } },
    },
  },
} satisfies Prisma.PilotScopeSelect;

export class PilotRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  findProject(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: { id: true, code: true, name: true },
    });
  }

  findScope(projectId: string) {
    return this.database.pilotScope.findFirst({
      where: { projectId, archivedAt: null },
      select: pilotScopeSelection,
    });
  }

  listSetup(projectId: string) {
    return Promise.all([
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
      this.database.sharedCapability.findMany({
        where: { projectId, archivedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          progress: true,
          deliveryStage: true,
        },
      }),
    ]);
  }

  upsertScope(
    projectId: string,
    data: Omit<Prisma.PilotScopeUncheckedCreateInput, "projectId">,
  ) {
    return this.database.pilotScope.upsert({
      where: { projectId },
      create: { projectId, ...data },
      update: { ...data, archivedAt: null },
      select: { id: true, projectId: true, name: true, supportOwnerId: true, rollbackOwnerId: true },
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

  countActiveMembers(projectId: string, userIds: string[]) {
    return this.database.projectMember.count({
      where: {
        projectId,
        userId: { in: userIds },
        archivedAt: null,
        user: { is: { isActive: true, archivedAt: null } },
      },
    });
  }

  findTeam(scopeId: string, teamId: string) {
    return this.database.pilotTeam.findFirst({
      where: { id: teamId, pilotScopeId: scopeId, archivedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        leadUserId: true,
        members: { where: { archivedAt: null }, select: { userId: true } },
      },
    });
  }

  createTeam(data: Prisma.PilotTeamUncheckedCreateInput) {
    return this.database.pilotTeam.create({
      data,
      select: { id: true, name: true, description: true, leadUserId: true },
    });
  }

  updateTeam(teamId: string, data: Prisma.PilotTeamUncheckedUpdateInput) {
    return this.database.pilotTeam.update({
      where: { id: teamId },
      data,
      select: { id: true, name: true, description: true, leadUserId: true },
    });
  }

  async replaceTeamMembers(teamId: string, userIds: string[]) {
    await this.database.pilotTeamMember.deleteMany({ where: { pilotTeamId: teamId } });
    if (userIds.length) {
      await this.database.pilotTeamMember.createMany({
        data: userIds.map((userId) => ({ pilotTeamId: teamId, userId })),
      });
    }
  }

  findCapability(projectId: string, sharedCapabilityId: string) {
    return this.database.sharedCapability.findFirst({
      where: { id: sharedCapabilityId, projectId, archivedAt: null },
      select: { id: true, name: true },
    });
  }

  upsertCapability(data: Prisma.PilotScopeCapabilityUncheckedCreateInput) {
    return this.database.pilotScopeCapability.upsert({
      where: {
        pilotScopeId_sharedCapabilityId: {
          pilotScopeId: data.pilotScopeId,
          sharedCapabilityId: data.sharedCapabilityId,
        },
      },
      create: data,
      update: { disposition: data.disposition, notes: data.notes },
    });
  }

  findCriterion(scopeId: string, criterionId: string) {
    return this.database.pilotCriterion.findFirst({
      where: { id: criterionId, pilotScopeId: scopeId },
    });
  }

  createCriterion(data: Prisma.PilotCriterionUncheckedCreateInput) {
    return this.database.pilotCriterion.create({ data });
  }

  updateCriterion(
    criterionId: string,
    data: Prisma.PilotCriterionUncheckedUpdateInput,
  ) {
    return this.database.pilotCriterion.update({ where: { id: criterionId }, data });
  }

  findIssue(scopeId: string, issueId: string) {
    return this.database.pilotIssue.findFirst({
      where: { id: issueId, pilotScopeId: scopeId, archivedAt: null },
    });
  }

  createIssue(data: Prisma.PilotIssueUncheckedCreateInput) {
    return this.database.pilotIssue.create({ data });
  }

  updateIssue(issueId: string, data: Prisma.PilotIssueUncheckedUpdateInput) {
    return this.database.pilotIssue.update({ where: { id: issueId }, data });
  }

  updateScope(scopeId: string, data: Prisma.PilotScopeUncheckedUpdateInput) {
    return this.database.pilotScope.update({ where: { id: scopeId }, data });
  }

  listApprovalHistory(projectId: string) {
    return this.database.auditLog.findMany({
      where: {
        projectId,
        action: {
          in: [
            "pilot.criterion_reviewed",
            "pilot.business_sign_off_reviewed",
            "pilot.technical_sign_off_reviewed",
            "pilot.final_decision_reviewed",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        afterState: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, displayName: true } },
      },
    });
  }
}

export type PilotWorkspace = NonNullable<
  Awaited<ReturnType<PilotRepository["findScope"]>>
>;
