"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import {
  archiveMembershipSchema,
  createMilestonePlanSchema,
  createMilestoneSchema,
  createProjectSchema,
  milestoneIdSchema,
  projectIdSchema,
  reorderMilestoneSchema,
  setMembershipSchema,
  updateMilestoneSchema,
  updateProjectSchema,
  type ProjectActionResult,
} from "@/lib/projects/project.schemas";
import { ExecutionDomainError } from "@/lib/execution/execution.service";
import {
  projectCommands,
  ProjectDomainError,
} from "@/lib/projects/project.service";

type Parsed<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { flatten: () => { fieldErrors: Record<string, string[]> } };
    };

function validationFailure(
  parsed: Extract<Parsed<never>, { success: false }>,
): ProjectActionResult {
  return {
    success: false,
    message: "Review the highlighted fields.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}

async function handleCommand(
  operation: () => Promise<unknown>,
  projectId?: string,
): Promise<ProjectActionResult> {
  try {
    await operation();
    revalidatePath("/");
    revalidatePath("/projects");
    if (projectId) {
      revalidatePath(`/projects/${projectId}`);
      revalidatePath(`/projects/${projectId}/members`);
    }
    return { success: true };
  } catch (error) {
    if (
      error instanceof ProjectDomainError ||
      error instanceof ExecutionDomainError
    ) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

export async function createProjectAction(
  input: unknown,
): Promise<ProjectActionResult> {
  const context = await requirePermission(PERMISSIONS.PROJECT_CREATE);
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  let projectId: string | undefined;
  const result = await handleCommand(async () => {
    const project = await projectCommands.createProject(
      context.user.id,
      parsed.data,
      hasPermission(context.user, PERMISSIONS.SYSTEM_MANAGE),
    );
    projectId = project.id;
  });

  return result.success
    ? { ...result, redirectTo: `/projects/${projectId}` }
    : result;
}

export async function updateProjectAction(
  input: unknown,
): Promise<ProjectActionResult> {
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.PROJECT_UPDATE,
    parsed.data.projectId,
  );

  const result = await handleCommand(
    () =>
      projectCommands.updateProject(
        context.user.id,
        parsed.data,
        hasPermission(context.user, PERMISSIONS.SYSTEM_MANAGE),
      ),
    parsed.data.projectId,
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function archiveProjectAction(input: unknown) {
  const parsed = projectIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.PROJECT_UPDATE,
    parsed.data.projectId,
  );

  const result = await handleCommand(
    () =>
      projectCommands.archiveProject(
        context.user.id,
        parsed.data.projectId,
      ),
    parsed.data.projectId,
  );
  return result.success ? { ...result, redirectTo: "/projects" } : result;
}

export async function createMilestoneAction(input: unknown) {
  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.MILESTONE_MANAGE,
    parsed.data.projectId,
  );

  const result = await handleCommand(
    () => projectCommands.createMilestone(context.user.id, parsed.data),
    parsed.data.projectId,
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function createMilestonePlanAction(input: unknown) {
  const parsed = createMilestonePlanSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  const context = await requirePermission(
    PERMISSIONS.MILESTONE_MANAGE,
    parsed.data.projectId,
  );
  await requirePermission(
    PERMISSIONS.WORK_ITEM_MANAGE,
    parsed.data.projectId,
  );

  let milestoneId: string | undefined;
  const result = await handleCommand(async () => {
    const milestone = await projectCommands.createMilestonePlan(
      context.user.id,
      parsed.data,
    );
    milestoneId = milestone.id;
  }, parsed.data.projectId);

  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}/milestones#milestone-${milestoneId}`,
      }
    : result;
}

export async function updateMilestoneAction(input: unknown) {
  const parsed = updateMilestoneSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.MILESTONE_MANAGE,
    parsed.data.projectId,
  );

  const result = await handleCommand(
    () => projectCommands.updateMilestone(context.user.id, parsed.data),
    parsed.data.projectId,
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function archiveMilestoneAction(input: unknown) {
  const parsed = milestoneIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.MILESTONE_MANAGE,
    parsed.data.projectId,
  );

  const result = await handleCommand(
    () =>
      projectCommands.archiveMilestone(
        context.user.id,
        parsed.data.projectId,
        parsed.data.milestoneId,
    ),
    parsed.data.projectId,
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function reorderMilestoneAction(input: unknown) {
  const parsed = reorderMilestoneSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.MILESTONE_MANAGE,
    parsed.data.projectId,
  );

  return handleCommand(
    () => projectCommands.reorderMilestone(context.user.id, parsed.data),
    parsed.data.projectId,
  );
}

export async function setMembershipAction(input: unknown) {
  const parsed = setMembershipSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    parsed.data.projectId,
  );

  return handleCommand(
    () => projectCommands.setMembership(context.user.id, parsed.data),
    parsed.data.projectId,
  );
}

export async function archiveMembershipAction(input: unknown) {
  const parsed = archiveMembershipSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requirePermission(
    PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    parsed.data.projectId,
  );

  return handleCommand(
    () =>
      projectCommands.archiveMembership(
        context.user.id,
        parsed.data.projectId,
        parsed.data.userId,
      ),
    parsed.data.projectId,
  );
}
