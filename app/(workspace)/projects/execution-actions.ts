"use server";

import { revalidatePath } from "next/cache";

import {
  requireAssignedSharedCapabilityUpdate,
  requireAssignedWorkItemUpdate,
  requirePermission,
} from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  assignedCapabilityExecutionSchema,
  assignedExecutionSchema,
  createSharedCapabilitySchema,
  createWorkItemSchema,
  sharedCapabilityIdSchema,
  updateSharedCapabilitySchema,
  updateWorkItemSchema,
  workItemIdSchema,
} from "@/lib/execution/execution.schemas";
import {
  executionCommands,
  ExecutionDomainError,
} from "@/lib/execution/execution.service";
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
    revalidatePath(`/projects/${projectId}/capabilities`);
    return { success: true };
  } catch (error) {
    if (error instanceof ExecutionDomainError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

import { z } from "zod";

export async function createWorkItemAction(input: unknown) {
  const parsed = createWorkItemSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.WORK_ITEM_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.createWorkItem(context.user.id, parsed.data),
  );
  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}`,
      }
    : result;
}

export async function createBatchWorkItemsAction(input: unknown) {
  const batchSchema = z.object({
    projectId: z.string().min(1),
    milestoneId: z.string().min(1),
    items: z.array(createWorkItemSchema).min(1, "Add at least one sub-milestone item."),
  });
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    const issueMessages = parsed.error.issues.map((issue) => {
      const pathStr = issue.path.join(".");
      const match = pathStr.match(/^items\.(\d+)\.(.+)$/);
      if (match) {
        const rowIdx = parseInt(match[1], 10) + 1;
        const fieldName = match[2];
        return `Row #${rowIdx} (${fieldName}): ${issue.message}`;
      }
      return issue.message;
    });
    return {
      success: false,
      message: issueMessages.length > 0 ? issueMessages.join(" | ") : "Review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const context = await requirePermission(
    PERMISSIONS.WORK_ITEM_MANAGE,
    parsed.data.projectId,
  );

  const result = await command(parsed.data.projectId, async () => {
    for (const item of parsed.data.items) {
      await executionCommands.createWorkItem(context.user.id, item);
    }
  });

  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}`,
      }
    : result;
}

export async function updateWorkItemAction(input: unknown) {
  const parsed = updateWorkItemSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.WORK_ITEM_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.updateWorkItem(context.user.id, parsed.data),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function updateAssignedWorkItemAction(input: unknown) {
  const parsed = assignedExecutionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { context, workItem } = await requireAssignedWorkItemUpdate(
    parsed.data.workItemId,
  );
  return command(workItem.milestone.projectId, () =>
    executionCommands.updateAssignedWorkItem(context.user.id, parsed.data),
  );
}

export async function archiveWorkItemAction(input: unknown) {
  const parsed = workItemIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.WORK_ITEM_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.archiveWorkItem(
      context.user.id,
      parsed.data.projectId,
      parsed.data.milestoneId,
      parsed.data.workItemId,
    ),
  );
  return result.success
    ? { ...result, redirectTo: `/projects/${parsed.data.projectId}` }
    : result;
}

export async function createCapabilityAction(input: unknown) {
  const parsed = createSharedCapabilitySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.createCapability(context.user.id, parsed.data),
  );
  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}/capabilities`,
      }
    : result;
}

export async function updateCapabilityAction(input: unknown) {
  const parsed = updateSharedCapabilitySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.updateCapability(context.user.id, parsed.data),
  );
  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}/capabilities`,
      }
    : result;
}

export async function updateAssignedCapabilityAction(input: unknown) {
  const parsed = assignedCapabilityExecutionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { context, capability } =
    await requireAssignedSharedCapabilityUpdate(
      parsed.data.sharedCapabilityId,
    );
  return command(capability.projectId, () =>
    executionCommands.updateAssignedCapability(context.user.id, parsed.data),
  );
}

export async function archiveCapabilityAction(input: unknown) {
  const parsed = sharedCapabilityIdSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const context = await requirePermission(
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
    parsed.data.projectId,
  );
  const result = await command(parsed.data.projectId, () =>
    executionCommands.archiveCapability(
      context.user.id,
      parsed.data.projectId,
      parsed.data.sharedCapabilityId,
    ),
  );
  return result.success
    ? {
        ...result,
        redirectTo: `/projects/${parsed.data.projectId}/capabilities`,
      }
    : result;
}
