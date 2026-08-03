"use server";

import { revalidatePath } from "next/cache";

import {
  AccessAdministrationError,
  assignUserRole,
  clearUserLockout,
  createUser,
  resetUserPassword,
  removeProjectMembership,
  setProjectMembership,
  setUserAccountStatus,
  updateUserDisplayName,
} from "@/lib/auth/access.service";
import {
  assignRoleSchema,
  clearLockoutSchema,
  createUserSchema,
  projectMembershipSchema,
  removeProjectMembershipSchema,
  resetPasswordSchema,
  setAccountStatusSchema,
  updateDisplayNameSchema,
  type ActionResult,
} from "@/lib/auth/auth.schemas";

export async function clearLockoutAction(input: unknown) {
  return runAccessAction(
    clearLockoutSchema.safeParse(input),
    clearUserLockout,
  );
}
import { requirePermission } from "@/lib/auth/authorization";
import { SYSTEM_MANAGE_PERMISSION } from "@/lib/auth/permissions";

type SchemaResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { flatten: () => { fieldErrors: Record<string, string[]> } };
    };

async function runAccessAction<T>(
  parsed: SchemaResult<T>,
  operation: (actorId: string, input: T) => Promise<unknown>,
): Promise<ActionResult> {
  const context = await requirePermission(SYSTEM_MANAGE_PERMISSION);

  if (!parsed.success) {
    return {
      success: false,
      message: "Review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await operation(context.user.id, parsed.data);
    revalidatePath("/access");
    return { success: true };
  } catch (error) {
    if (error instanceof AccessAdministrationError) {
      return { success: false, message: error.message };
    }

    throw error;
  }
}

export async function createUserAction(input: unknown) {
  return runAccessAction(createUserSchema.safeParse(input), createUser);
}

export async function assignRoleAction(input: unknown) {
  return runAccessAction(assignRoleSchema.safeParse(input), assignUserRole);
}

export async function setProjectMembershipAction(input: unknown) {
  return runAccessAction(
    projectMembershipSchema.safeParse(input),
    setProjectMembership,
  );
}

export async function removeProjectMembershipAction(input: unknown) {
  return runAccessAction(
    removeProjectMembershipSchema.safeParse(input),
    removeProjectMembership,
  );
}

export async function setAccountStatusAction(input: unknown) {
  return runAccessAction(
    setAccountStatusSchema.safeParse(input),
    setUserAccountStatus,
  );
}

export async function resetPasswordAction(input: unknown) {
  return runAccessAction(
    resetPasswordSchema.safeParse(input),
    resetUserPassword,
  );
}

export async function updateDisplayNameAction(input: unknown) {
  return runAccessAction(
    updateDisplayNameSchema.safeParse(input),
    updateUserDisplayName,
  );
}
