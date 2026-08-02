"use server";

import { revalidatePath } from "next/cache";

import {
  archiveProjectGroupSchema,
  createProjectGroupSchema,
  updateProjectGroupSchema,
  type ProjectGroupActionResult,
} from "@/lib/project-groups/project-group.schemas";
import {
  projectGroupCommands,
  ProjectGroupDomainError,
} from "@/lib/project-groups/project-group.service";
import { requirePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Parsed<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { flatten: () => { fieldErrors: Record<string, string[]> } };
    };

function validationFailure(
  parsed: Extract<Parsed<never>, { success: false }>,
): ProjectGroupActionResult {
  return {
    success: false,
    message: "Review the highlighted fields.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}

async function requireGroupAdmin() {
  return requirePermission(PERMISSIONS.SYSTEM_MANAGE);
}

async function handleCommand(
  operation: () => Promise<unknown>,
): Promise<ProjectGroupActionResult> {
  try {
    await operation();
    revalidatePath("/");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    if (error instanceof ProjectGroupDomainError) {
      return { success: false, message: error.message };
    }
    throw error;
  }
}

export async function createProjectGroupAction(
  input: unknown,
): Promise<ProjectGroupActionResult> {
  const context = await requireGroupAdmin();
  const parsed = createProjectGroupSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  return handleCommand(() =>
    projectGroupCommands.create(context.user.id, parsed.data),
  );
}

export async function updateProjectGroupAction(
  input: unknown,
): Promise<ProjectGroupActionResult> {
  const parsed = updateProjectGroupSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requireGroupAdmin();

  return handleCommand(() =>
    projectGroupCommands.update(context.user.id, parsed.data),
  );
}

export async function archiveProjectGroupAction(
  input: unknown,
): Promise<ProjectGroupActionResult> {
  const parsed = archiveProjectGroupSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);
  const context = await requireGroupAdmin();

  return handleCommand(() =>
    projectGroupCommands.archive(context.user.id, parsed.data.groupId),
  );
}

