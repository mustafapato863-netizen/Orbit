"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { ProjectActionResult } from "@/lib/projects/project.schemas";
import {
  archiveWorkstreamSchema,
  createWorkstreamSchema,
  updateWorkstreamSchema,
} from "@/lib/workstreams/workstream.schemas";
import {
  workstreamCommands,
  WorkstreamDomainError,
} from "@/lib/workstreams/workstream-management.service";

function failure(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ProjectActionResult {
  return { success: false, message: "Review the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

async function handle(projectId: string, operation: () => Promise<unknown>): Promise<ProjectActionResult> {
  try {
    await operation();
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/workstreams`);
    return { success: true };
  } catch (error) {
    if (error instanceof WorkstreamDomainError) return { success: false, message: error.message };
    throw error;
  }
}

export async function createWorkstreamAction(input: unknown) {
  const parsed = createWorkstreamSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PROJECT_UPDATE, parsed.data.projectId);
  const result = await handle(parsed.data.projectId, () => workstreamCommands.create(context.user.id, parsed.data));
  return result.success ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/workstreams` } : result;
}

export async function updateWorkstreamAction(input: unknown) {
  const parsed = updateWorkstreamSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PROJECT_UPDATE, parsed.data.projectId);
  const result = await handle(parsed.data.projectId, () => workstreamCommands.update(context.user.id, parsed.data));
  return result.success ? { ...result, redirectTo: `/projects/${parsed.data.projectId}/workstreams` } : result;
}

export async function archiveWorkstreamAction(input: unknown) {
  const parsed = archiveWorkstreamSchema.safeParse(input);
  if (!parsed.success) return failure(parsed.error);
  const context = await requirePermission(PERMISSIONS.PROJECT_UPDATE, parsed.data.projectId);
  return handle(parsed.data.projectId, () =>
    workstreamCommands.archive(context.user.id, parsed.data.projectId, parsed.data.workstreamId),
  );
}
