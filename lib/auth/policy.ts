import type { SessionUser } from "@/lib/auth/session";
import {
  SYSTEM_MANAGE_PERMISSION,
  type PermissionCode,
} from "@/lib/auth/permissions";

export function hasPermission(
  user: Pick<SessionUser, "permissions">,
  permission: PermissionCode,
) {
  return (
    user.permissions.includes(SYSTEM_MANAGE_PERMISSION) ||
    user.permissions.includes(permission)
  );
}

export function hasProjectMembership(
  user: Pick<SessionUser, "permissions" | "projectMemberships">,
  projectId: string,
) {
  return (
    user.permissions.includes(SYSTEM_MANAGE_PERMISSION) ||
    user.projectMemberships.some(
      (membership) =>
        membership.projectId === projectId && membership.isPrivate !== true,
    )
  );
}

export function canAccessProject(
  user: Pick<SessionUser, "permissions" | "projectMemberships">,
  permission: PermissionCode,
  projectId: string,
) {
  return hasPermission(user, permission) && hasProjectMembership(user, projectId);
}

export function canUpdateAssignedWorkItem(
  user: Pick<SessionUser, "id" | "permissions">,
  ownerId: string | null,
) {
  return (
    hasPermission(user, "work_item.manage") ||
    (hasPermission(user, "work_item.update_assigned") &&
      ownerId === user.id)
  );
}
