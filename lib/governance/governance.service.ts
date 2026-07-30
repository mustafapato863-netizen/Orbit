import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import type {
  CreateDecisionInput,
  CreateRiskInput,
  DecisionCommentInput,
  ReviewDecisionInput,
  UpdateDecisionInput,
  UpdateRiskInput,
} from "@/lib/governance/governance.schemas";
import { deriveRiskSeverity } from "@/lib/governance/risk-severity";
import { prisma } from "@/lib/prisma";
import { optionalDateValue, optionalTextValue } from "@/lib/projects/project.utils";
import { GovernanceRepository } from "@/lib/repositories/governance.repository";

export class GovernanceDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_PROJECT"
      | "INVALID_MILESTONE"
      | "INVALID_TARGET"
      | "INVALID_WORKSTREAM"
      | "INVALID_OWNER"
      | "REVIEW_REQUIRED",
  ) {
    super(message);
    this.name = "GovernanceDomainError";
  }
}

function riskState(risk: {
  title: string;
  probability: number;
  impact: number;
  severity: string;
  status: string;
  milestoneId: string | null;
  workItemId: string | null;
  sharedCapabilityId: string | null;
  primaryWorkstreamId: string | null;
  ownerId: string | null;
  dueDate: Date | null;
}) {
  return {
    title: risk.title,
    probability: risk.probability,
    impact: risk.impact,
    severity: risk.severity,
    status: risk.status,
    milestoneId: risk.milestoneId,
    workItemId: risk.workItemId,
    sharedCapabilityId: risk.sharedCapabilityId,
    primaryWorkstreamId: risk.primaryWorkstreamId,
    ownerId: risk.ownerId,
    dueDate: risk.dueDate?.toISOString().slice(0, 10) ?? null,
  };
}

function decisionState(decision: {
  title: string;
  status: string;
  milestoneId: string | null;
  ownerId: string | null;
  requiredBy: Date | null;
  decisionText: string | null;
  decidedAt: Date | null;
}, workstreamIds?: string[]) {
  return {
    title: decision.title,
    status: decision.status,
    milestoneId: decision.milestoneId,
    ownerId: decision.ownerId,
    requiredBy: decision.requiredBy?.toISOString().slice(0, 10) ?? null,
    decisionText: decision.decisionText,
    decidedAt: decision.decidedAt?.toISOString() ?? null,
    ...(workstreamIds ? { affectedWorkstreamIds: workstreamIds } : {}),
  };
}

export class GovernanceService {
  private readonly repository: GovernanceRepository;

  constructor(private readonly database: Prisma.TransactionClient) {
    this.repository = new GovernanceRepository(database);
  }

  private async validateProject(projectId: string) {
    if (!(await this.repository.findProject(projectId))) {
      throw new GovernanceDomainError("Project not found.", "INVALID_PROJECT");
    }
  }

  private async validateOwner(projectId: string, ownerId: string) {
    if (ownerId && !(await this.repository.findActiveMember(projectId, ownerId))) {
      throw new GovernanceDomainError(
        "The owner must be an active project member.",
        "INVALID_OWNER",
      );
    }
  }

  private async validateMilestone(projectId: string, milestoneId: string) {
    if (milestoneId && !(await this.repository.findMilestone(projectId, milestoneId))) {
      throw new GovernanceDomainError(
        "The related Milestone is unavailable.",
        "INVALID_MILESTONE",
      );
    }
  }

  private async validateWorkstreams(projectId: string, workstreamIds: string[]) {
    if (
      workstreamIds.length &&
      (await this.repository.countWorkstreams(projectId, workstreamIds)) !==
        new Set(workstreamIds).size
    ) {
      throw new GovernanceDomainError(
        "One or more Workstreams are unavailable.",
        "INVALID_WORKSTREAM",
      );
    }
  }

  private async riskData(input: CreateRiskInput | UpdateRiskInput) {
    await this.validateProject(input.projectId);
    await this.validateMilestone(input.projectId, input.milestoneId);
    await this.validateOwner(input.projectId, input.ownerId);
    await this.validateWorkstreams(input.projectId,
      input.primaryWorkstreamId ? [input.primaryWorkstreamId] : [],
    );

    let workItemId: string | null = null;
    let sharedCapabilityId: string | null = null;
    if (input.targetType === "WORK_ITEM") {
      const workItem = await this.repository.findWorkItem(
        input.projectId,
        input.targetId,
      );
      if (!workItem) {
        throw new GovernanceDomainError(
          "The related Work Item is unavailable.",
          "INVALID_TARGET",
        );
      }
      if (input.milestoneId && workItem.milestoneId !== input.milestoneId) {
        throw new GovernanceDomainError(
          "The Work Item does not belong to the selected Milestone.",
          "INVALID_TARGET",
        );
      }
      workItemId = workItem.id;
    } else if (input.targetType === "SHARED_CAPABILITY") {
      const capability = await this.repository.findCapability(
        input.projectId,
        input.targetId,
      );
      if (!capability) {
        throw new GovernanceDomainError(
          "The related Shared Capability is unavailable.",
          "INVALID_TARGET",
        );
      }
      sharedCapabilityId = capability.id;
    }

    return {
      title: input.title.trim(),
      description: input.description.trim(),
      probability: input.probability,
      impact: input.impact,
      severity: deriveRiskSeverity(input.probability, input.impact),
      status: input.status,
      milestoneId: input.milestoneId || null,
      workItemId,
      sharedCapabilityId,
      primaryWorkstreamId: input.primaryWorkstreamId || null,
      ownerId: input.ownerId || null,
      mitigation: optionalTextValue(input.mitigation),
      dueDate: optionalDateValue(input.dueDate),
    };
  }

  async createRisk(actorId: string, input: CreateRiskInput) {
    const created = await this.repository.createRisk({
      projectId: input.projectId,
      ...(await this.riskData(input)),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "risk.created",
      entityType: "Risk",
      entityId: created.id,
      afterState: riskState(created),
    });
    return created;
  }

  async updateRisk(actorId: string, input: UpdateRiskInput) {
    const existing = await this.repository.findRisk(input.projectId, input.riskId);
    if (!existing) throw new GovernanceDomainError("Risk not found.", "NOT_FOUND");
    const updated = await this.repository.updateRisk(
      input.riskId,
      await this.riskData(input),
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "risk.updated",
      entityType: "Risk",
      entityId: updated.id,
      beforeState: riskState(existing),
      afterState: riskState(updated),
    });
    return updated;
  }

  async archiveRisk(actorId: string, projectId: string, riskId: string) {
    const existing = await this.repository.findRisk(projectId, riskId);
    if (!existing) throw new GovernanceDomainError("Risk not found.", "NOT_FOUND");
    const updated = await this.repository.updateRisk(riskId, {
      archivedAt: new Date(),
      status: "CLOSED",
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "risk.archived",
      entityType: "Risk",
      entityId: riskId,
      beforeState: riskState(existing),
      afterState: riskState(updated),
    });
  }

  private async decisionData(input: CreateDecisionInput | UpdateDecisionInput) {
    await this.validateProject(input.projectId);
    await this.validateMilestone(input.projectId, input.milestoneId);
    await this.validateOwner(input.projectId, input.ownerId);
    await this.validateWorkstreams(input.projectId, input.affectedWorkstreamIds);
    const isDecided = ["APPROVED", "REJECTED", "SUPERSEDED"].includes(input.status);
    return {
      title: input.title.trim(),
      description: input.description.trim(),
      milestoneId: input.milestoneId || null,
      ownerId: input.ownerId || null,
      requiredBy: optionalDateValue(input.requiredBy),
      recommendedDirection: optionalTextValue(input.recommendedDirection),
      status: input.status,
      decisionText: optionalTextValue(input.decisionText),
      decidedAt: isDecided ? new Date() : null,
    };
  }

  async createDecision(actorId: string, input: CreateDecisionInput) {
    if (["APPROVED", "REJECTED"].includes(input.status)) {
      throw new GovernanceDomainError(
        "Approved and Rejected outcomes must be recorded through Reviewer authorization.",
        "REVIEW_REQUIRED",
      );
    }
    const created = await this.repository.createDecision({
      projectId: input.projectId,
      ...(await this.decisionData(input)),
    });
    await this.repository.replaceDecisionWorkstreams(
      created.id,
      input.affectedWorkstreamIds,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "decision.created",
      entityType: "Decision",
      entityId: created.id,
      afterState: decisionState(created, input.affectedWorkstreamIds),
    });
    return created;
  }

  async updateDecision(actorId: string, input: UpdateDecisionInput) {
    const existing = await this.repository.findDecision(
      input.projectId,
      input.decisionId,
    );
    if (!existing) {
      throw new GovernanceDomainError("Decision not found.", "NOT_FOUND");
    }
    const reviewStatuses = ["APPROVED", "REJECTED"];
    if (
      (reviewStatuses.includes(input.status) ||
        reviewStatuses.includes(existing.status)) &&
      input.status !== existing.status
    ) {
      throw new GovernanceDomainError(
        "Approved and Rejected outcomes can be changed only through Reviewer authorization.",
        "REVIEW_REQUIRED",
      );
    }
    const data = await this.decisionData(input);
    if (reviewStatuses.includes(existing.status)) {
      data.decisionText = existing.decisionText;
      data.decidedAt = existing.decidedAt;
    }
    const updated = await this.repository.updateDecision(
      input.decisionId,
      data,
    );
    await this.repository.replaceDecisionWorkstreams(
      input.decisionId,
      input.affectedWorkstreamIds,
    );
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "decision.updated",
      entityType: "Decision",
      entityId: updated.id,
      beforeState: decisionState(
        existing,
        existing.affectedWorkstreams.map(({ workstreamId }) => workstreamId),
      ),
      afterState: decisionState(updated, input.affectedWorkstreamIds),
    });
    return updated;
  }

  async reviewDecision(actorId: string, input: ReviewDecisionInput) {
    const existing = await this.repository.findDecision(
      input.projectId,
      input.decisionId,
    );
    if (!existing) {
      throw new GovernanceDomainError("Decision not found.", "NOT_FOUND");
    }
    const updated = await this.repository.updateDecision(input.decisionId, {
      status: input.status,
      decisionText: input.decisionText.trim(),
      decidedAt: input.status === "DEFERRED" ? null : new Date(),
    });
    if (input.comment) {
      await this.repository.createDecisionComment({
        projectId: input.projectId,
        decisionId: input.decisionId,
        authorId: actorId,
        body: input.comment.trim(),
      });
    }
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "decision.reviewed",
      entityType: "Decision",
      entityId: updated.id,
      beforeState: decisionState(existing),
      afterState: decisionState(updated),
      metadata: { commentAdded: Boolean(input.comment) },
    });
    return updated;
  }

  async addDecisionComment(actorId: string, input: DecisionCommentInput) {
    const decision = await this.repository.findDecision(
      input.projectId,
      input.decisionId,
    );
    if (!decision) {
      throw new GovernanceDomainError("Decision not found.", "NOT_FOUND");
    }
    const comment = await this.repository.createDecisionComment({
      projectId: input.projectId,
      decisionId: input.decisionId,
      authorId: actorId,
      body: input.body.trim(),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "decision.comment_added",
      entityType: "Decision",
      entityId: input.decisionId,
      metadata: { commentId: comment.id },
    });
    return comment;
  }

  async archiveDecision(actorId: string, projectId: string, decisionId: string) {
    const existing = await this.repository.findDecision(projectId, decisionId);
    if (!existing) {
      throw new GovernanceDomainError("Decision not found.", "NOT_FOUND");
    }
    const updated = await this.repository.updateDecision(decisionId, {
      archivedAt: new Date(),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "decision.archived",
      entityType: "Decision",
      entityId: decisionId,
      beforeState: decisionState(existing),
      afterState: decisionState(updated),
    });
  }
}

async function transaction<T>(
  operation: (service: GovernanceService) => Promise<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (database) => operation(new GovernanceService(database)),
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
      throw error;
    }
  }
  throw new Error("Governance transaction retry limit reached.");
}

export const governanceCommands = {
  createRisk: (actorId: string, input: CreateRiskInput) =>
    transaction((service) => service.createRisk(actorId, input)),
  updateRisk: (actorId: string, input: UpdateRiskInput) =>
    transaction((service) => service.updateRisk(actorId, input)),
  archiveRisk: (actorId: string, projectId: string, riskId: string) =>
    transaction((service) => service.archiveRisk(actorId, projectId, riskId)),
  createDecision: (actorId: string, input: CreateDecisionInput) =>
    transaction((service) => service.createDecision(actorId, input)),
  updateDecision: (actorId: string, input: UpdateDecisionInput) =>
    transaction((service) => service.updateDecision(actorId, input)),
  reviewDecision: (actorId: string, input: ReviewDecisionInput) =>
    transaction((service) => service.reviewDecision(actorId, input)),
  addDecisionComment: (actorId: string, input: DecisionCommentInput) =>
    transaction((service) => service.addDecisionComment(actorId, input)),
  archiveDecision: (actorId: string, projectId: string, decisionId: string) =>
    transaction((service) =>
      service.archiveDecision(actorId, projectId, decisionId),
    ),
};

export const governanceQueries = {
  getProject: (projectId: string) =>
    new GovernanceRepository(prisma).findProject(projectId),
  getSetup: (projectId: string) =>
    new GovernanceRepository(prisma).listSetup(projectId),
  listRisks: (projectId: string) =>
    new GovernanceRepository(prisma).listRisks(projectId),
  getRisk: (projectId: string, riskId: string) =>
    new GovernanceRepository(prisma).findRisk(projectId, riskId),
  listDecisions: (projectId: string) =>
    new GovernanceRepository(prisma).listDecisions(projectId),
  getDecision: (projectId: string, decisionId: string) =>
    new GovernanceRepository(prisma).findDecision(projectId, decisionId),
  listDecisionHistory: (projectId: string, decisionId: string) =>
    new GovernanceRepository(prisma).listDecisionHistory(projectId, decisionId),
};
