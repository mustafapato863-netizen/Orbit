import {
  MembershipRole,
  type Prisma,
} from "../generated/prisma/client";
import { localAccountSeeds, workstreamSeeds } from "./seed-data";
import type { PmsWorkstreamCode } from "./pms-seed-data";
import {
  PMS_PROJECT_SEED,
  pmsMilestoneSeeds,
  pmsSharedCapabilitySeeds,
  pmsWorkItemSeeds,
  validatePmsSeedDefinitions,
} from "./pms-seed-data";
import {
  pmsDecisionCommentSeeds,
  pmsDecisionSeeds,
  pmsRiskSeeds,
} from "./pms-governance-seed-data";
import {
  PMS_PILOT_SCOPE_SEED,
  pmsPilotCapabilitySeeds,
  pmsPilotCriterionSeeds,
  pmsPilotIssueSeeds,
  pmsPilotTeamSeeds,
} from "./pms-pilot-seed-data";

function databaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function optionalDatabaseDate(value: string | null) {
  return value ? databaseDate(value) : null;
}


const membershipByRole = {
  Administrator: MembershipRole.PROJECT_MANAGER,
  "Project Manager": MembershipRole.PROJECT_MANAGER,
  "Technical Lead": MembershipRole.TECHNICAL_LEAD,
  Reviewer: MembershipRole.REVIEWER,
  Viewer: MembershipRole.VIEWER,
} as const;

export async function upsertPmsDashboardProject(
  transaction: Prisma.TransactionClient,
) {
  validatePmsSeedDefinitions();

  const project = await transaction.project.upsert({
    where: { code: PMS_PROJECT_SEED.code },
    create: { ...PMS_PROJECT_SEED, projectType: "SOFTWARE" },
    update: {
      slug: PMS_PROJECT_SEED.slug,
      name: PMS_PROJECT_SEED.name,
      description: PMS_PROJECT_SEED.description,
      status: PMS_PROJECT_SEED.status,
      progress: PMS_PROJECT_SEED.progress,
      projectType: "SOFTWARE",
      startDate: PMS_PROJECT_SEED.startDate,
      targetDate: PMS_PROJECT_SEED.targetDate,
      archivedAt: null,
    },
    select: { id: true },
  });

  for (const workstream of workstreamSeeds) {
    await transaction.workstream.upsert({
      where: {
        projectId_code: { projectId: project.id, code: workstream.code },
      },
      create: { projectId: project.id, ...workstream },
      update: {
        slug: workstream.slug,
        name: workstream.name,
        description: workstream.description,
        colorToken: workstream.colorToken,
        iconKey: workstream.iconKey,
        sortOrder: workstream.sortOrder,
        archivedAt: null,
      },
    });
  }
  const workstreams = await transaction.workstream.findMany({
    where: { projectId: project.id, archivedAt: null },
    select: { id: true, code: true },
  });
  const workstreamIds = new Map<PmsWorkstreamCode, string>(
    workstreams.map(({ id, code }) => [code as PmsWorkstreamCode, id]),
  );

  const seededUsers = await transaction.user.findMany({
    where: {
      normalizedEmail: {
        in: localAccountSeeds.map(({ email }) => email),
      },
      isActive: true,
      archivedAt: null,
    },
    select: { id: true, normalizedEmail: true },
  });
  const userIds = new Map(
    seededUsers.map(({ id, normalizedEmail }) => [normalizedEmail, id]),
  );

  for (const account of localAccountSeeds) {
    const userId = userIds.get(account.email);
    if (!userId) continue;
    await transaction.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId },
      },
      create: {
        projectId: project.id,
        userId,
        role: membershipByRole[account.roleName],
      },
      update: {
        role: membershipByRole[account.roleName],
        archivedAt: null,
      },
    });
  }

  const milestoneIds = new Map<string, string>();
  for (const milestone of pmsMilestoneSeeds) {
    const stored = await transaction.milestone.upsert({
      where: {
        projectId_code: {
          projectId: project.id,
          code: milestone.code,
        },
      },
      create: {
        projectId: project.id,
        ...milestone,
        startDate: databaseDate(milestone.startDate),
        dueDate: databaseDate(milestone.dueDate),
      },
      update: {
        name: milestone.name,
        businessPurpose: milestone.businessPurpose,
        status: milestone.status,
        progress: milestone.progress,
        riskLevel: milestone.riskLevel,
        deliveryStage: milestone.deliveryStage,
        releaseHorizon: milestone.releaseHorizon,
        sortOrder: milestone.sortOrder,
        startDate: databaseDate(milestone.startDate),
        dueDate: databaseDate(milestone.dueDate),
        deliveredScope: milestone.deliveredScope,
        remainingScope: milestone.remainingScope,
        currentBlockers: milestone.currentBlockers,
        nextAction: milestone.nextAction,
        firstReleaseImpact: milestone.firstReleaseImpact,
        archivedAt: null,
      },
      select: { id: true },
    });
    milestoneIds.set(milestone.code, stored.id);
  }

  const workItemIds = new Map<string, string>();
  for (const item of pmsWorkItemSeeds) {
    const milestoneId = milestoneIds.get(item.milestoneCode);
    const primaryWorkstreamId = workstreamIds.get(item.primaryWorkstream);
    if (!milestoneId || !primaryWorkstreamId) {
      throw new Error(`PMS Work Item lookup failed for ${item.code}.`);
    }
    const ownerId = userIds.get(item.ownerEmail) ?? null;
    const existing = await transaction.workItem.findUnique({
      where: {
        milestoneId_code: { milestoneId, code: item.code },
      },
      select: { id: true },
    });
    if (existing) {
      await transaction.workItemWorkstream.deleteMany({
        where: { workItemId: existing.id },
      });
    }
    const stored = await transaction.workItem.upsert({
      where: {
        milestoneId_code: { milestoneId, code: item.code },
      },
      create: {
        milestoneId,
        primaryWorkstreamId,
        ownerId,
        code: item.code,
        name: item.name,
        description: item.description,
        status: item.status,
        progress: item.progress,
        deliveryStage: item.deliveryStage,
        lifecycleStage: item.lifecycleStage,
        deliveryHealth: item.deliveryHealth,
        deploymentEnvironment: item.deploymentEnvironment,
        releaseScope: item.releaseScope,
        plannedStartDate: optionalDatabaseDate(item.plannedStartDate),
        plannedCheckDate: optionalDatabaseDate(item.plannedCheckDate),
        plannedProductionReadyDate: optionalDatabaseDate(
          item.plannedProductionReadyDate,
        ),
        plannedGoLiveDate: optionalDatabaseDate(item.plannedGoLiveDate),
        actualStartDate: optionalDatabaseDate(item.actualStartDate),
        actualCheckDate: optionalDatabaseDate(item.actualCheckDate),
        actualProductionReadyDate: optionalDatabaseDate(
          item.actualProductionReadyDate,
        ),
        actualGoLiveDate: optionalDatabaseDate(item.actualGoLiveDate),
        nextGate: item.nextGate,
        nextAction: item.nextAction,
        startDate: databaseDate(item.startDate),
        dueDate: databaseDate(item.dueDate),
        riskLevel: item.riskLevel,
        blocker: item.blocker,
        blockerSummary: item.blockerSummary,
        implementationNotes: item.implementationNotes,
        notes: item.notes,
        acceptanceCriteria: item.acceptanceCriteria,
      },
      update: {
        primaryWorkstreamId,
        ownerId,
        name: item.name,
        description: item.description,
        status: item.status,
        progress: item.progress,
        deliveryStage: item.deliveryStage,
        lifecycleStage: item.lifecycleStage,
        deliveryHealth: item.deliveryHealth,
        deploymentEnvironment: item.deploymentEnvironment,
        releaseScope: item.releaseScope,
        plannedStartDate: optionalDatabaseDate(item.plannedStartDate),
        plannedCheckDate: optionalDatabaseDate(item.plannedCheckDate),
        plannedProductionReadyDate: optionalDatabaseDate(
          item.plannedProductionReadyDate,
        ),
        plannedGoLiveDate: optionalDatabaseDate(item.plannedGoLiveDate),
        actualStartDate: optionalDatabaseDate(item.actualStartDate),
        actualCheckDate: optionalDatabaseDate(item.actualCheckDate),
        actualProductionReadyDate: optionalDatabaseDate(
          item.actualProductionReadyDate,
        ),
        actualGoLiveDate: optionalDatabaseDate(item.actualGoLiveDate),
        nextGate: item.nextGate,
        nextAction: item.nextAction,
        startDate: databaseDate(item.startDate),
        dueDate: databaseDate(item.dueDate),
        riskLevel: item.riskLevel,
        blocker: item.blocker,
        blockerSummary: item.blockerSummary,
        implementationNotes: item.implementationNotes,
        notes: item.notes,
        acceptanceCriteria: item.acceptanceCriteria,
        archivedAt: null,
      },
      select: { id: true },
    });
    workItemIds.set(item.code, stored.id);
    if (item.supportingWorkstreams.length) {
      await transaction.workItemWorkstream.createMany({
        data: item.supportingWorkstreams.map((code) => {
          const workstreamId = workstreamIds.get(code);
          if (!workstreamId) {
            throw new Error(
              `PMS supporting Workstream lookup failed for ${code}.`,
            );
          }
          return { workItemId: stored.id, workstreamId };
        }),
      });
    }
    await transaction.workPackageCheckpoint.deleteMany({
      where: { workItemId: stored.id },
    });
    if (item.checkpoints.length) {
      await transaction.workPackageCheckpoint.createMany({
        data: item.checkpoints.map((checkpoint) => ({
          workItemId: stored.id,
          checkpointCode: checkpoint.code,
          plannedDate: optionalDatabaseDate(checkpoint.plannedDate),
          actualDate: optionalDatabaseDate(checkpoint.actualDate),
          status: checkpoint.status,
          note: checkpoint.note,
        })),
      });
    }
  }

  const seededWorkItemCodes = pmsWorkItemSeeds.map(({ code }) => code);
  await transaction.workItem.updateMany({
    where: {
      milestone: { projectId: project.id },
      code: { notIn: seededWorkItemCodes },
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });
  await transaction.milestone.updateMany({
    where: {
      projectId: project.id,
      code: { notIn: pmsMilestoneSeeds.map(({ code }) => code) },
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });

  const capabilityIds = new Map<string, string>();
  for (const capability of pmsSharedCapabilitySeeds) {
    const primaryWorkstreamId = workstreamIds.get(
      capability.primaryWorkstream,
    );
    if (!primaryWorkstreamId) {
      throw new Error(
        `PMS capability Workstream lookup failed for ${capability.code}.`,
      );
    }
    const ownerId = userIds.get(capability.ownerEmail) ?? null;
    const existing = await transaction.sharedCapability.findUnique({
      where: {
        projectId_code: {
          projectId: project.id,
          code: capability.code,
        },
      },
      select: { id: true },
    });
    if (existing) {
      await transaction.sharedCapabilityWorkstream.deleteMany({
        where: { sharedCapabilityId: existing.id },
      });
    }
    const stored = await transaction.sharedCapability.upsert({
      where: {
        projectId_code: {
          projectId: project.id,
          code: capability.code,
        },
      },
      create: {
        projectId: project.id,
        primaryWorkstreamId,
        ownerId,
        code: capability.code,
        name: capability.name,
        description: capability.description,
        status: capability.status,
        progress: capability.progress,
        riskLevel: capability.riskLevel,
        deliveryStage: capability.deliveryStage,
        nextGate: capability.nextGate,
        startDate: databaseDate(capability.startDate),
        dueDate: databaseDate(capability.dueDate),
        blocker: capability.blocker,
        notes: capability.notes,
        acceptanceCriteria: capability.acceptanceCriteria,
      },
      update: {
        primaryWorkstreamId,
        ownerId,
        name: capability.name,
        description: capability.description,
        status: capability.status,
        progress: capability.progress,
        riskLevel: capability.riskLevel,
        deliveryStage: capability.deliveryStage,
        nextGate: capability.nextGate,
        startDate: databaseDate(capability.startDate),
        dueDate: databaseDate(capability.dueDate),
        blocker: capability.blocker,
        notes: capability.notes,
        acceptanceCriteria: capability.acceptanceCriteria,
        archivedAt: null,
      },
      select: { id: true },
    });
    capabilityIds.set(capability.code, stored.id);

    if (capability.supportingWorkstreams.length) {
      await transaction.sharedCapabilityWorkstream.createMany({
        data: capability.supportingWorkstreams.map((code) => {
          const workstreamId = workstreamIds.get(code);
          if (!workstreamId) {
            throw new Error(
              `PMS supporting capability Workstream lookup failed for ${code}.`,
            );
          }
          return { sharedCapabilityId: stored.id, workstreamId };
        }),
      });
    }

    await transaction.milestoneSharedCapability.deleteMany({
      where: {
        projectId: project.id,
        sharedCapabilityId: stored.id,
      },
    });
    if (capability.milestoneLinks.length) {
      await transaction.milestoneSharedCapability.createMany({
        data: capability.milestoneLinks.map((link) => {
          const milestoneId = milestoneIds.get(link.code);
          if (!milestoneId) {
            throw new Error(
              `PMS capability milestone lookup failed for ${link.code}.`,
            );
          }
          return {
            projectId: project.id,
            milestoneId,
            sharedCapabilityId: stored.id,
            sourceReference: link.sourceReference,
            dependencyNotes: link.dependencyNotes,
            isCritical: link.isCritical,
          };
        }),
      });
    }
  }

  const seededCapabilityCodes = pmsSharedCapabilitySeeds.map(
    ({ code }) => code,
  );
  await transaction.sharedCapability.updateMany({
    where: {
      projectId: project.id,
      archivedAt: null,
      ...(seededCapabilityCodes.length
        ? { code: { notIn: seededCapabilityCodes } }
        : {}),
    },
    data: { archivedAt: new Date() },
  });

  for (const risk of pmsRiskSeeds) {
    const milestoneId = milestoneIds.get(risk.milestoneCode);
    const primaryWorkstreamId = workstreamIds.get(risk.primaryWorkstream);
    if (!milestoneId || !primaryWorkstreamId) {
      throw new Error(`PMS Risk lookup failed for ${risk.id}.`);
    }
    const workItemId = risk.workItemCode
      ? workItemIds.get(risk.workItemCode)
      : null;
    const sharedCapabilityId = risk.capabilityCode
      ? capabilityIds.get(risk.capabilityCode)
      : null;
    if (
      (risk.workItemCode && !workItemId) ||
      (risk.capabilityCode && !sharedCapabilityId)
    ) {
      throw new Error(`PMS Risk target lookup failed for ${risk.id}.`);
    }
    await transaction.risk.upsert({
      where: { id: risk.id },
      create: {
        id: risk.id,
        projectId: project.id,
        milestoneId,
        workItemId,
        sharedCapabilityId,
        primaryWorkstreamId,
        ownerId: userIds.get(risk.ownerEmail) ?? null,
        title: risk.title,
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        severity: risk.severity,
        status: risk.status,
        mitigation: risk.mitigation,
        dueDate: databaseDate(risk.dueDate),
      },
      update: {
        projectId: project.id,
        milestoneId,
        workItemId,
        sharedCapabilityId,
        primaryWorkstreamId,
        ownerId: userIds.get(risk.ownerEmail) ?? null,
        title: risk.title,
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        severity: risk.severity,
        status: risk.status,
        mitigation: risk.mitigation,
        dueDate: databaseDate(risk.dueDate),
        archivedAt: null,
      },
    });
  }

  for (const decision of pmsDecisionSeeds) {
    const milestoneId = milestoneIds.get(decision.milestoneCode);
    if (!milestoneId) {
      throw new Error(`PMS Decision lookup failed for ${decision.id}.`);
    }
    await transaction.decision.upsert({
      where: { id: decision.id },
      create: {
        id: decision.id,
        projectId: project.id,
        milestoneId,
        ownerId: userIds.get(decision.ownerEmail) ?? null,
        title: decision.title,
        description: decision.description,
        requiredBy: databaseDate(decision.requiredBy),
        recommendedDirection: decision.recommendedDirection,
        status: decision.status,
        decisionText: decision.decisionText,
        decidedAt:
          decision.status === "APPROVED" ? new Date("2026-07-25T08:00:00Z") : null,
      },
      update: {
        projectId: project.id,
        milestoneId,
        ownerId: userIds.get(decision.ownerEmail) ?? null,
        title: decision.title,
        description: decision.description,
        requiredBy: databaseDate(decision.requiredBy),
        recommendedDirection: decision.recommendedDirection,
        status: decision.status,
        decisionText: decision.decisionText,
        decidedAt:
          decision.status === "APPROVED" ? new Date("2026-07-25T08:00:00Z") : null,
        archivedAt: null,
      },
    });
    await transaction.decisionWorkstream.deleteMany({
      where: { decisionId: decision.id },
    });
    await transaction.decisionWorkstream.createMany({
      data: decision.affectedWorkstreams.map((code) => {
        const workstreamId = workstreamIds.get(code);
        if (!workstreamId) {
          throw new Error(`PMS Decision Workstream lookup failed for ${code}.`);
        }
        return { decisionId: decision.id, workstreamId };
      }),
    });
  }

  for (const comment of pmsDecisionCommentSeeds) {
    await transaction.comment.upsert({
      where: { id: comment.id },
      create: {
        id: comment.id,
        projectId: project.id,
        decisionId: comment.decisionId,
        authorId: userIds.get(comment.authorEmail) ?? null,
        body: comment.body,
      },
      update: {
        projectId: project.id,
        decisionId: comment.decisionId,
        authorId: userIds.get(comment.authorEmail) ?? null,
        body: comment.body,
        archivedAt: null,
      },
    });
  }

  const pilotScope = await transaction.pilotScope.upsert({
    where: { projectId: project.id },
    create: {
      id: PMS_PILOT_SCOPE_SEED.id,
      projectId: project.id,
      name: PMS_PILOT_SCOPE_SEED.name,
      knownLimitations: PMS_PILOT_SCOPE_SEED.knownLimitations,
      supportOwnerId:
        userIds.get(PMS_PILOT_SCOPE_SEED.supportOwnerEmail) ?? null,
      rollbackOwnerId:
        userIds.get(PMS_PILOT_SCOPE_SEED.rollbackOwnerEmail) ?? null,
    },
    update: {
      name: PMS_PILOT_SCOPE_SEED.name,
      knownLimitations: PMS_PILOT_SCOPE_SEED.knownLimitations,
      supportOwnerId:
        userIds.get(PMS_PILOT_SCOPE_SEED.supportOwnerEmail) ?? null,
      rollbackOwnerId:
        userIds.get(PMS_PILOT_SCOPE_SEED.rollbackOwnerEmail) ?? null,
      archivedAt: null,
    },
    select: { id: true },
  });

  await transaction.pilotScopeCapability.deleteMany({
    where: { pilotScopeId: pilotScope.id },
  });

  for (const team of pmsPilotTeamSeeds) {
    const stored = await transaction.pilotTeam.upsert({
      where: {
        pilotScopeId_name: {
          pilotScopeId: pilotScope.id,
          name: team.name,
        },
      },
      create: {
        id: team.id,
        pilotScopeId: pilotScope.id,
        name: team.name,
        description: team.description,
        leadUserId: userIds.get(team.leadEmail) ?? null,
      },
      update: {
        description: team.description,
        leadUserId: userIds.get(team.leadEmail) ?? null,
        archivedAt: null,
      },
      select: { id: true },
    });
    const memberIds = team.memberEmails
      .map((email) => userIds.get(email))
      .filter((id): id is string => Boolean(id));
    await transaction.pilotTeamMember.deleteMany({
      where: { pilotTeamId: stored.id },
    });
    if (memberIds.length) {
      await transaction.pilotTeamMember.createMany({
        data: memberIds.map((userId) => ({
          pilotTeamId: stored.id,
          userId,
        })),
      });
    }
  }

  for (const [capabilityCode, disposition, notes] of pmsPilotCapabilitySeeds) {
    const sharedCapabilityId = capabilityIds.get(capabilityCode);
    if (!sharedCapabilityId) {
      throw new Error(
        `PMS Pilot capability lookup failed for ${capabilityCode}.`,
      );
    }
    await transaction.pilotScopeCapability.upsert({
      where: {
        pilotScopeId_sharedCapabilityId: {
          pilotScopeId: pilotScope.id,
          sharedCapabilityId,
        },
      },
      create: {
        projectId: project.id,
        pilotScopeId: pilotScope.id,
        sharedCapabilityId,
        disposition,
        notes,
      },
      update: { disposition, notes },
    });
  }

  for (const criterion of pmsPilotCriterionSeeds) {
    await transaction.pilotCriterion.upsert({
      where: {
        pilotScopeId_code: {
          pilotScopeId: pilotScope.id,
          code: criterion.code,
        },
      },
      create: {
        id: criterion.id,
        pilotScopeId: pilotScope.id,
        code: criterion.code,
        type: criterion.type,
        title: criterion.title,
        description: criterion.description,
        isRequired: criterion.isRequired,
      },
      update: {
        type: criterion.type,
        title: criterion.title,
        description: criterion.description,
        isRequired: criterion.isRequired,
      },
    });
  }

  for (const issue of pmsPilotIssueSeeds) {
    await transaction.pilotIssue.upsert({
      where: { id: issue.id },
      create: {
        id: issue.id,
        pilotScopeId: pilotScope.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        isBlocking: issue.isBlocking,
        ownerId: userIds.get(issue.ownerEmail) ?? null,
        mitigation: issue.mitigation,
        dueDate: databaseDate(issue.dueDate),
      },
      update: {
        pilotScopeId: pilotScope.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        isBlocking: issue.isBlocking,
        ownerId: userIds.get(issue.ownerEmail) ?? null,
        mitigation: issue.mitigation,
        dueDate: databaseDate(issue.dueDate),
        archivedAt: null,
      },
    });
  }

  return project;
}
