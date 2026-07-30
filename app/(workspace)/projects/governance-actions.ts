"use server";

import { revalidatePath } from "next/cache";

import {
  requireAnyPermission,
  requirePermission,
} from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  createDecisionSchema,
  createRiskSchema,
  decisionCommentSchema,
  decisionIdSchema,
  reviewDecisionSchema,
  riskIdSchema,
  updateDecisionSchema,
  updateRiskSchema,
} from "@/lib/governance/governance.schemas";
import {
  governanceCommands,
  GovernanceDomainError,
} from "@/lib/governance/governance.service";
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
    revalidatePath(`/projects/${projectId}/risks`);
    return { success: true };
  } catch (error) {
    if (error instanceof GovernanceDomainError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

export async function createRiskAction(input: unknown) {
  const parsed = createRiskSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.RISK_MANAGE, parsed.data.projectId);
  const result = await command(parsed.data.projectId, () =>
    governanceCommands.createRisk(context.user.id, parsed.data),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/risks` }
    : result;
}

export async function updateRiskAction(input: unknown) {
  const parsed = updateRiskSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.RISK_MANAGE, parsed.data.projectId);
  const result = await command(parsed.data.projectId, () =>
    governanceCommands.updateRisk(context.user.id, parsed.data),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/risks` }
    : result;
}

export async function archiveRiskAction(input: unknown) {
  const parsed = riskIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.RISK_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    governanceCommands.archiveRisk(
      context.user.id,
      parsed.data.projectId,
      parsed.data.riskId,
    ),
  );
}

export async function createDecisionAction(input: unknown) {
  const parsed = createDecisionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.DECISION_MANAGE, parsed.data.projectId);
  const result = await command(parsed.data.projectId, () =>
    governanceCommands.createDecision(context.user.id, parsed.data),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/risks` }
    : result;
}

export async function updateDecisionAction(input: unknown) {
  const parsed = updateDecisionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.DECISION_MANAGE, parsed.data.projectId);
  const result = await command(parsed.data.projectId, () =>
    governanceCommands.updateDecision(context.user.id, parsed.data),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/risks` }
    : result;
}

export async function reviewDecisionAction(input: unknown) {
  const parsed = reviewDecisionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.DECISION_REVIEW, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    governanceCommands.reviewDecision(context.user.id, parsed.data),
  );
}

export async function addDecisionCommentAction(input: unknown) {
  const parsed = decisionCommentSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requireAnyPermission(
    [PERMISSIONS.DECISION_MANAGE, PERMISSIONS.DECISION_REVIEW],
    parsed.data.projectId,
  );
  return command(parsed.data.projectId, () =>
    governanceCommands.addDecisionComment(context.user.id, parsed.data),
  );
}

export async function archiveDecisionAction(input: unknown) {
  const parsed = decisionIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(PERMISSIONS.DECISION_MANAGE, parsed.data.projectId);
  return command(parsed.data.projectId, () =>
    governanceCommands.archiveDecision(
      context.user.id,
      parsed.data.projectId,
      parsed.data.decisionId,
    ),
  );
}
