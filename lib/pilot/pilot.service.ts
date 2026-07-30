import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import type {
  CreatePilotCriterionInput,
  CreatePilotIssueInput,
  CreatePilotTeamInput,
  FinalPilotDecisionInput,
  PilotCapabilityInput,
  PilotScopeInput,
  PilotSignOffInput,
  ReviewPilotCriterionInput,
  UpdatePilotCriterionInput,
  UpdatePilotIssueInput,
  UpdatePilotTeamInput,
} from "@/lib/pilot/pilot.schemas";
import { derivePilotReadiness } from "@/lib/pilot/pilot-readiness";
import { prisma } from "@/lib/prisma";
import { optionalDateValue, optionalTextValue } from "@/lib/projects/project.utils";
import { PilotRepository } from "@/lib/repositories/pilot.repository";

export class PilotDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "DUPLICATE"
      | "INVALID_MEMBER"
      | "INVALID_CAPABILITY"
      | "NOT_READY",
  ) {
    super(message);
    this.name = "PilotDomainError";
  }
}

export class PilotService {
  private readonly repository: PilotRepository;

  constructor(private readonly database: Prisma.TransactionClient) {
    this.repository = new PilotRepository(database);
  }

  private async scope(projectId: string) {
    const scope = await this.repository.findScope(projectId);
    if (!scope) throw new PilotDomainError("Pilot workspace not found.", "NOT_FOUND");
    return scope;
  }

  private async validateMembers(projectId: string, userIds: string[]) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (
      unique.length &&
      (await this.repository.countActiveMembers(projectId, unique)) !== unique.length
    ) {
      throw new PilotDomainError(
        "Every Pilot owner, lead, and user must be an active project member.",
        "INVALID_MEMBER",
      );
    }
  }

  async saveScope(actorId: string, input: PilotScopeInput) {
    if (!(await this.repository.findProject(input.projectId))) {
      throw new PilotDomainError("Project not found.", "NOT_FOUND");
    }
    await this.validateMembers(input.projectId, [
      input.supportOwnerId,
      input.rollbackOwnerId,
    ]);
    const before = await this.repository.findScope(input.projectId);
    const saved = await this.repository.upsertScope(input.projectId, {
      name: input.name.trim(),
      knownLimitations: optionalTextValue(input.knownLimitations),
      supportOwnerId: input.supportOwnerId || null,
      rollbackOwnerId: input.rollbackOwnerId || null,
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: before ? "pilot.scope_updated" : "pilot.scope_created",
      entityType: "PilotScope",
      entityId: saved.id,
      beforeState: before
        ? {
            name: before.name,
            supportOwnerId: before.supportOwnerId,
            rollbackOwnerId: before.rollbackOwnerId,
          }
        : undefined,
      afterState: {
        name: saved.name,
        supportOwnerId: saved.supportOwnerId,
        rollbackOwnerId: saved.rollbackOwnerId,
      },
    });
    return saved;
  }

  private teamData(input: CreatePilotTeamInput | UpdatePilotTeamInput) {
    return {
      name: input.name.trim(),
      description: optionalTextValue(input.description),
      leadUserId: input.leadUserId || null,
    };
  }

  async createTeam(actorId: string, input: CreatePilotTeamInput) {
    const scope = await this.scope(input.projectId);
    await this.validateMembers(input.projectId, [
      input.leadUserId,
      ...input.memberIds,
    ]);
    const created = await this.repository.createTeam({
      pilotScopeId: scope.id,
      ...this.teamData(input),
    });
    await this.repository.replaceTeamMembers(created.id, input.memberIds);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.team_created",
      entityType: "PilotTeam",
      entityId: created.id,
      afterState: { name: created.name, leadUserId: created.leadUserId, memberIds: input.memberIds },
      metadata: { pilotScopeId: scope.id },
    });
    return created;
  }

  async updateTeam(actorId: string, input: UpdatePilotTeamInput) {
    const scope = await this.scope(input.projectId);
    const existing = await this.repository.findTeam(scope.id, input.teamId);
    if (!existing) throw new PilotDomainError("Pilot team not found.", "NOT_FOUND");
    await this.validateMembers(input.projectId, [
      input.leadUserId,
      ...input.memberIds,
    ]);
    const updated = await this.repository.updateTeam(input.teamId, this.teamData(input));
    await this.repository.replaceTeamMembers(updated.id, input.memberIds);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.team_updated",
      entityType: "PilotTeam",
      entityId: updated.id,
      beforeState: {
        name: existing.name,
        leadUserId: existing.leadUserId,
        memberIds: existing.members.map(({ userId }) => userId),
      },
      afterState: { name: updated.name, leadUserId: updated.leadUserId, memberIds: input.memberIds },
    });
  }

  async archiveTeam(actorId: string, projectId: string, teamId: string) {
    const scope = await this.scope(projectId);
    const existing = await this.repository.findTeam(scope.id, teamId);
    if (!existing) throw new PilotDomainError("Pilot team not found.", "NOT_FOUND");
    await this.repository.updateTeam(teamId, { archivedAt: new Date() });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "pilot.team_archived",
      entityType: "PilotTeam",
      entityId: teamId,
      beforeState: { name: existing.name },
      afterState: { archived: true },
    });
  }

  async setCapability(actorId: string, input: PilotCapabilityInput) {
    const scope = await this.scope(input.projectId);
    const capability = await this.repository.findCapability(
      input.projectId,
      input.sharedCapabilityId,
    );
    if (!capability) {
      throw new PilotDomainError("Shared Capability not found.", "INVALID_CAPABILITY");
    }
    const existing = scope.capabilities.find(
      ({ sharedCapabilityId }) => sharedCapabilityId === input.sharedCapabilityId,
    );
    await this.repository.upsertCapability({
      projectId: input.projectId,
      pilotScopeId: scope.id,
      sharedCapabilityId: input.sharedCapabilityId,
      disposition: input.disposition,
      notes: optionalTextValue(input.notes),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.capability_set",
      entityType: "PilotScopeCapability",
      entityId: `${scope.id}:${input.sharedCapabilityId}`,
      beforeState: existing
        ? { disposition: existing.disposition, notes: existing.notes }
        : undefined,
      afterState: { disposition: input.disposition, notes: optionalTextValue(input.notes) },
      metadata: { capabilityName: capability.name },
    });
  }

  private criterionData(
    input: CreatePilotCriterionInput | UpdatePilotCriterionInput,
  ) {
    return {
      code: input.code.trim(),
      type: input.type,
      title: input.title.trim(),
      description: optionalTextValue(input.description),
      isRequired: input.isRequired,
    };
  }

  async createCriterion(actorId: string, input: CreatePilotCriterionInput) {
    const scope = await this.scope(input.projectId);
    const created = await this.repository.createCriterion({
      pilotScopeId: scope.id,
      ...this.criterionData(input),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.criterion_created",
      entityType: "PilotCriterion",
      entityId: created.id,
      afterState: {
        code: created.code,
        type: created.type,
        title: created.title,
        isRequired: created.isRequired,
      },
    });
    return created;
  }

  async updateCriterion(actorId: string, input: UpdatePilotCriterionInput) {
    const scope = await this.scope(input.projectId);
    const existing = await this.repository.findCriterion(scope.id, input.criterionId);
    if (!existing) {
      throw new PilotDomainError("Pilot criterion not found.", "NOT_FOUND");
    }
    const updated = await this.repository.updateCriterion(
      input.criterionId,
      this.criterionData(input),
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.criterion_updated",
      entityType: "PilotCriterion",
      entityId: updated.id,
      beforeState: {
        code: existing.code,
        type: existing.type,
        title: existing.title,
        isRequired: existing.isRequired,
      },
      afterState: {
        code: updated.code,
        type: updated.type,
        title: updated.title,
        isRequired: updated.isRequired,
      },
    });
  }

  async reviewCriterion(actorId: string, input: ReviewPilotCriterionInput) {
    const scope = await this.scope(input.projectId);
    const existing = await this.repository.findCriterion(scope.id, input.criterionId);
    if (!existing) {
      throw new PilotDomainError("Pilot criterion not found.", "NOT_FOUND");
    }
    const updated = await this.repository.updateCriterion(input.criterionId, {
      status: input.status,
      evidence: input.evidence.trim(),
      reviewerId: actorId,
      reviewedAt: new Date(),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.criterion_reviewed",
      entityType: "PilotCriterion",
      entityId: updated.id,
      beforeState: { status: existing.status, evidence: existing.evidence },
      afterState: { status: updated.status, evidence: updated.evidence },
      metadata: { criterionType: updated.type, outcome: updated.status },
    });
  }

  private async issueData(input: CreatePilotIssueInput | UpdatePilotIssueInput) {
    await this.validateMembers(input.projectId, [input.ownerId]);
    const resolved = input.status === "RESOLVED" || input.status === "CLOSED";
    return {
      title: input.title.trim(),
      description: optionalTextValue(input.description),
      severity: input.severity,
      status: input.status,
      isBlocking: input.isBlocking,
      ownerId: input.ownerId || null,
      mitigation: optionalTextValue(input.mitigation),
      dueDate: optionalDateValue(input.dueDate),
      resolvedAt: resolved ? new Date() : null,
    };
  }

  async createIssue(actorId: string, input: CreatePilotIssueInput) {
    const scope = await this.scope(input.projectId);
    const created = await this.repository.createIssue({
      pilotScopeId: scope.id,
      ...(await this.issueData(input)),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.issue_created",
      entityType: "PilotIssue",
      entityId: created.id,
      afterState: {
        title: created.title,
        severity: created.severity,
        status: created.status,
        isBlocking: created.isBlocking,
        ownerId: created.ownerId,
      },
    });
    return created;
  }

  async updateIssue(actorId: string, input: UpdatePilotIssueInput) {
    const scope = await this.scope(input.projectId);
    const existing = await this.repository.findIssue(scope.id, input.issueId);
    if (!existing) throw new PilotDomainError("Pilot issue not found.", "NOT_FOUND");
    const updated = await this.repository.updateIssue(
      input.issueId,
      await this.issueData(input),
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.issue_updated",
      entityType: "PilotIssue",
      entityId: updated.id,
      beforeState: {
        title: existing.title,
        severity: existing.severity,
        status: existing.status,
        isBlocking: existing.isBlocking,
        ownerId: existing.ownerId,
      },
      afterState: {
        title: updated.title,
        severity: updated.severity,
        status: updated.status,
        isBlocking: updated.isBlocking,
        ownerId: updated.ownerId,
      },
    });
  }

  async archiveIssue(actorId: string, projectId: string, issueId: string) {
    const scope = await this.scope(projectId);
    const existing = await this.repository.findIssue(scope.id, issueId);
    if (!existing) throw new PilotDomainError("Pilot issue not found.", "NOT_FOUND");
    await this.repository.updateIssue(issueId, { archivedAt: new Date() });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "pilot.issue_archived",
      entityType: "PilotIssue",
      entityId: issueId,
      beforeState: { title: existing.title, status: existing.status },
      afterState: { archived: true },
    });
  }

  async reviewSignOff(actorId: string, input: PilotSignOffInput) {
    const scope = await this.scope(input.projectId);
    const business = input.signOff === "BUSINESS";
    const data = business
      ? {
          businessSignOffStatus: input.outcome,
          businessSignOffById: actorId,
          businessSignedOffAt: new Date(),
        }
      : {
          technicalSignOffStatus: input.outcome,
          technicalSignOffById: actorId,
          technicalSignedOffAt: new Date(),
        };
    await this.repository.updateScope(scope.id, data);
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: business
        ? "pilot.business_sign_off_reviewed"
        : "pilot.technical_sign_off_reviewed",
      entityType: "PilotScope",
      entityId: scope.id,
      beforeState: {
        status: business
          ? scope.businessSignOffStatus
          : scope.technicalSignOffStatus,
      },
      afterState: { status: input.outcome },
      metadata: { notes: input.notes.trim(), outcome: input.outcome },
    });
  }

  async reviewFinalDecision(actorId: string, input: FinalPilotDecisionInput) {
    const scope = await this.scope(input.projectId);
    if (input.status === "APPROVED" && !derivePilotReadiness(scope).approvalReady) {
      throw new PilotDomainError(
        "The Pilot cannot be approved until both gates, both sign-offs, owners, scope, and blockers are ready.",
        "NOT_READY",
      );
    }
    await this.repository.updateScope(scope.id, {
      finalDecisionStatus: input.status,
      finalDecision: input.finalDecision.trim(),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "pilot.final_decision_reviewed",
      entityType: "PilotScope",
      entityId: scope.id,
      beforeState: {
        status: scope.finalDecisionStatus,
        decision: scope.finalDecision,
      },
      afterState: {
        status: input.status,
        decision: input.finalDecision.trim(),
      },
      metadata: { outcome: input.status },
    });
  }
}

async function transaction<T>(operation: (service: PilotService) => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (database) => operation(new PilotService(database)),
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
      if (code === "P2002") {
        throw new PilotDomainError(
          "A Pilot record with that name or code already exists.",
          "DUPLICATE",
        );
      }
      throw error;
    }
  }
  throw new Error("Pilot transaction retry limit reached.");
}

export const pilotCommands = {
  saveScope: (actorId: string, input: PilotScopeInput) =>
    transaction((service) => service.saveScope(actorId, input)),
  createTeam: (actorId: string, input: CreatePilotTeamInput) =>
    transaction((service) => service.createTeam(actorId, input)),
  updateTeam: (actorId: string, input: UpdatePilotTeamInput) =>
    transaction((service) => service.updateTeam(actorId, input)),
  archiveTeam: (actorId: string, projectId: string, teamId: string) =>
    transaction((service) => service.archiveTeam(actorId, projectId, teamId)),
  setCapability: (actorId: string, input: PilotCapabilityInput) =>
    transaction((service) => service.setCapability(actorId, input)),
  createCriterion: (actorId: string, input: CreatePilotCriterionInput) =>
    transaction((service) => service.createCriterion(actorId, input)),
  updateCriterion: (actorId: string, input: UpdatePilotCriterionInput) =>
    transaction((service) => service.updateCriterion(actorId, input)),
  reviewCriterion: (actorId: string, input: ReviewPilotCriterionInput) =>
    transaction((service) => service.reviewCriterion(actorId, input)),
  createIssue: (actorId: string, input: CreatePilotIssueInput) =>
    transaction((service) => service.createIssue(actorId, input)),
  updateIssue: (actorId: string, input: UpdatePilotIssueInput) =>
    transaction((service) => service.updateIssue(actorId, input)),
  archiveIssue: (actorId: string, projectId: string, issueId: string) =>
    transaction((service) => service.archiveIssue(actorId, projectId, issueId)),
  reviewSignOff: (actorId: string, input: PilotSignOffInput) =>
    transaction((service) => service.reviewSignOff(actorId, input)),
  reviewFinalDecision: (actorId: string, input: FinalPilotDecisionInput) =>
    transaction((service) => service.reviewFinalDecision(actorId, input)),
};

export const pilotQueries = {
  getProject: (projectId: string) =>
    new PilotRepository(prisma).findProject(projectId),
  getScope: (projectId: string) =>
    new PilotRepository(prisma).findScope(projectId),
  getSetup: (projectId: string) =>
    new PilotRepository(prisma).listSetup(projectId),
  listApprovalHistory: (projectId: string) =>
    new PilotRepository(prisma).listApprovalHistory(projectId),
};
