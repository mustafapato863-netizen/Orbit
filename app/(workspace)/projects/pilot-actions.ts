"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  createPilotCriterionSchema,
  createPilotIssueSchema,
  createPilotTeamSchema,
  finalPilotDecisionSchema,
  pilotCapabilitySchema,
  pilotIssueIdSchema,
  pilotScopeSchema,
  pilotSignOffSchema,
  pilotTeamIdSchema,
  reviewPilotCriterionSchema,
  updatePilotCriterionSchema,
  updatePilotIssueSchema,
  updatePilotTeamSchema,
} from "@/lib/pilot/pilot.schemas";
import {
  pilotCommands,
  PilotDomainError,
} from "@/lib/pilot/pilot.service";
import type { ProjectActionResult } from "@/lib/projects/project.schemas";

function validationFailure(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ProjectActionResult {
  return {
    success: false,
    message: "Review the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function command(
  projectId: string,
  operation: () => Promise<unknown>,
): Promise<ProjectActionResult> {
  try {
    await operation();
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/pilot`);
    return { success: true };
  } catch (error) {
    if (error instanceof PilotDomainError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

export async function savePilotScopeAction(input: unknown) {
  const parsed = pilotScopeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.saveScope(context.user.id, parsed.data),
  );
}

export async function createPilotTeamAction(input: unknown) {
  const parsed = createPilotTeamSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.createTeam(context.user.id, parsed.data),
  );
}

export async function updatePilotTeamAction(input: unknown) {
  const parsed = updatePilotTeamSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.updateTeam(context.user.id, parsed.data),
  );
}

export async function archivePilotTeamAction(input: unknown) {
  const parsed = pilotTeamIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.archiveTeam(context.user.id, parsed.data.projectId, parsed.data.teamId),
  );
}

export async function setPilotCapabilityAction(input: unknown) {
  const parsed = pilotCapabilitySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.setCapability(context.user.id, parsed.data),
  );
}

export async function createPilotCriterionAction(input: unknown) {
  const parsed = createPilotCriterionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.createCriterion(context.user.id, parsed.data),
  );
}

export async function updatePilotCriterionAction(input: unknown) {
  const parsed = updatePilotCriterionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.updateCriterion(context.user.id, parsed.data),
  );
}

export async function reviewPilotCriterionAction(input: unknown) {
  const parsed = reviewPilotCriterionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_REVIEW, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.reviewCriterion(context.user.id, parsed.data),
  );
}

export async function createPilotIssueAction(input: unknown) {
  const parsed = createPilotIssueSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.createIssue(context.user.id, parsed.data),
  );
}

export async function updatePilotIssueAction(input: unknown) {
  const parsed = updatePilotIssueSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.updateIssue(context.user.id, parsed.data),
  );
}

export async function archivePilotIssueAction(input: unknown) {
  const parsed = pilotIssueIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.archiveIssue(context.user.id, parsed.data.projectId, parsed.data.issueId),
  );
}

export async function reviewPilotSignOffAction(input: unknown) {
  const parsed = pilotSignOffSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_REVIEW, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.reviewSignOff(context.user.id, parsed.data),
  );
}

export async function reviewFinalPilotDecisionAction(input: unknown) {
  const parsed = finalPilotDecisionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PILOT_REVIEW, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    pilotCommands.reviewFinalDecision(context.user.id, parsed.data),
  );
}
