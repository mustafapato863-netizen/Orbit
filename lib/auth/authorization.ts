import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getCurrentSession,
  type SessionContext,
} from "@/lib/auth/session";
import {
  type PermissionCode,
} from "@/lib/auth/permissions";
import {
  canUpdateAssignedWorkItem,
  canAccessProject,
  hasPermission,
} from "@/lib/auth/policy";

export class AuthenticationError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationError";
  }
}

export async function requireSession(options?: {
  allowPasswordChange?: boolean;
}): Promise<SessionContext> {
  const context = await getCurrentSession();

  if (!context) {
    throw new AuthenticationError();
  }

  if (context.user.mustChangePassword && !options?.allowPasswordChange) {
    throw new AuthorizationError();
  }

  return context;
}

export async function requirePermission(
  permission: PermissionCode,
  projectId?: string,
) {
  const context = await requireSession();

  if (
    !hasPermission(context.user, permission) ||
    (projectId && !canAccessProject(context.user, permission, projectId))
  ) {
    throw new AuthorizationError();
  }

  return context;
}

export async function requireAnyPermission(
  permissions: PermissionCode[],
  projectId?: string,
) {
  const context = await requireSession();
  const allowed = permissions.some(
    (permission) =>
      hasPermission(context.user, permission) &&
      (!projectId ||
        canAccessProject(context.user, permission, projectId)),
  );
  if (!allowed) throw new AuthorizationError();
  return context;
}

export async function requireWorkspaceSession() {
  const context = await getCurrentSession();

  if (!context) {
    redirect("/sign-in");
  }

  if (context.user.mustChangePassword) {
    redirect("/change-password");
  }

  return context;
}

export async function requirePagePermission(
  permission: PermissionCode,
  projectId?: string,
) {
  const context = await requireWorkspaceSession();

  if (
    !hasPermission(context.user, permission) ||
    (projectId && !canAccessProject(context.user, permission, projectId))
  ) {
    redirect("/forbidden");
  }

  return context;
}

export async function requireAssignedWorkItemUpdate(workItemId: string) {
  const context = await requireSession();
  const workItem = await prisma.workItem.findFirst({
    where: {
      id: workItemId,
      archivedAt: null,
      milestone: {
        is: { archivedAt: null, project: { is: { archivedAt: null } } },
      },
    },
    select: {
      ownerId: true,
      milestone: { select: { projectId: true } },
    },
  });

  if (
    !workItem ||
    !canAccessProject(
      context.user,
      "project.view",
      workItem.milestone.projectId,
    )
  ) {
    throw new AuthorizationError();
  }

  if (!canUpdateAssignedWorkItem(context.user, workItem.ownerId)) {
    throw new AuthorizationError();
  }

  return { context, workItem };
}

export async function requireAssignedSharedCapabilityUpdate(
  sharedCapabilityId: string,
) {
  const context = await requireSession();
  const capability = await prisma.sharedCapability.findFirst({
    where: {
      id: sharedCapabilityId,
      archivedAt: null,
      project: { is: { archivedAt: null } },
    },
    select: { ownerId: true, projectId: true },
  });

  if (
    !capability ||
    !canAccessProject(context.user, "project.view", capability.projectId)
  ) {
    throw new AuthorizationError();
  }

  const canManage = hasPermission(
    context.user,
    "shared_capability.manage",
  );
  const canUpdateAssigned =
    hasPermission(context.user, "shared_capability.update_assigned") &&
    capability.ownerId === context.user.id;

  if (!canManage && !canUpdateAssigned) {
    throw new AuthorizationError();
  }

  return { context, capability };
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthenticationError) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  throw error;
}
