import "server-only";

import { recordAuditEntry } from "@/lib/audit/audit.service";
import {
  normalizeEmail,
  type AssignRoleInput,
  type CreateUserInput,
  type ProjectMembershipInput,
  type RemoveProjectMembershipInput,
  type ResetPasswordInput,
  type SetAccountStatusInput,
  type UpdateDisplayNameInput,
} from "@/lib/auth/auth.schemas";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import {
  AccessRepository,
  type AccessOverview,
} from "@/lib/repositories/access.repository";

export class AccessAdministrationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "DUPLICATE_USER"
      | "NOT_FOUND"
      | "LAST_ADMINISTRATOR"
      | "LAST_PROJECT_MANAGER"
      | "PRIVATE_PROJECT"
      | "SELF_DEACTIVATION",
  ) {
    super(message);
    this.name = "AccessAdministrationError";
  }
}

export async function getAccessOverview(): Promise<AccessOverview> {
  const repository = new AccessRepository(prisma);
  const [users, roles, projects] = await Promise.all([
    repository.listUsers(),
    repository.listRoles(),
    repository.listProjects(),
  ]);

  return { users, roles, projects };
}

export async function createUser(
  actorId: string,
  input: CreateUserInput,
) {
  const passwordHash = await hashPassword(input.temporaryPassword);

  try {
    return await prisma.$transaction(async (transaction) => {
      const repository = new AccessRepository(transaction);
      const role = await repository.findActiveRole(input.roleId);

      if (!role) {
        throw new AccessAdministrationError(
          "The selected role is unavailable.",
          "NOT_FOUND",
        );
      }
      const projectIds = [...new Set(input.projectIds)];
      const projects = await repository.listActiveProjectsByIds(projectIds);
      if (projects.length !== projectIds.length) {
        throw new AccessAdministrationError(
          "One or more selected projects are unavailable.",
          "NOT_FOUND",
        );
      }
      if (
        role.name !== "Administrator" &&
        projects.some(({ isPrivate }) => isPrivate)
      ) {
        throw new AccessAdministrationError(
          "Administrator-only projects cannot be assigned to a non-administrator.",
          "PRIVATE_PROJECT",
        );
      }

      const user = await transaction.user.create({
        data: {
          email: input.email.trim(),
          normalizedEmail: normalizeEmail(input.email),
          displayName: input.displayName.trim(),
          passwordHash,
          mustChangePassword: true,
          userRoles: {
            create: { roleId: role.id, assignedById: actorId },
          },
          projectMemberships: projectIds.length
            ? {
                create: projectIds.map((projectId) => ({
                  projectId,
                  role: input.membershipRole,
                })),
              }
            : undefined,
        },
        select: { id: true, email: true, displayName: true },
      });

      await recordAuditEntry(transaction, {
        actorId,
        action: "access.user_created",
        entityType: "User",
        entityId: user.id,
        afterState: {
          email: user.email,
          displayName: user.displayName,
          role: role.name,
          projectMemberships: projects.map(({ id, name }) => ({
            projectId: id,
            projectName: name,
            role: input.membershipRole,
          })),
          mustChangePassword: true,
        },
      });

      return user;
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AccessAdministrationError(
        "A user with that email address already exists.",
        "DUPLICATE_USER",
      );
    }

    throw error;
  }
}

export async function assignUserRole(
  actorId: string,
  input: AssignRoleInput,
) {
  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const [user, role] = await Promise.all([
      repository.findUser(input.userId),
      repository.findActiveRole(input.roleId),
    ]);

    if (!user || !role) {
      throw new AccessAdministrationError(
        "The selected user or role is unavailable.",
        "NOT_FOUND",
      );
    }

    const existing = user.userRoles.some(({ role: item }) => item.id === role.id);

    if (!existing) {
      await transaction.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedById: actorId,
        },
      });
      await recordAuditEntry(transaction, {
        actorId,
        action: "access.role_assigned",
        entityType: "User",
        entityId: user.id,
        beforeState: { roles: user.userRoles.map(({ role: item }) => item.name) },
        afterState: {
          roles: [...user.userRoles.map(({ role: item }) => item.name), role.name],
        },
      });
    }

    return { changed: !existing };
  });
}

export async function setProjectMembership(
  actorId: string,
  input: ProjectMembershipInput,
) {
  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const [user, project, existing] = await Promise.all([
      repository.findUser(input.userId),
      repository.findActiveProject(input.projectId),
      repository.findMembership(input.userId, input.projectId),
    ]);

    if (!user || !project) {
      throw new AccessAdministrationError(
        "The selected user or project is unavailable.",
        "NOT_FOUND",
      );
    }
    const targetIsAdministrator = user.userRoles.some(
      ({ role }) => role.name === "Administrator",
    );
    if (project.isPrivate && !targetIsAdministrator) {
      throw new AccessAdministrationError(
        "Administrator-only projects cannot be assigned to a non-administrator.",
        "PRIVATE_PROJECT",
      );
    }

    await transaction.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: user.id,
        },
      },
      create: {
        projectId: project.id,
        userId: user.id,
        role: input.membershipRole,
      },
      update: { role: input.membershipRole, archivedAt: null },
    });

    await recordAuditEntry(transaction, {
      actorId,
      projectId: project.id,
      action: "access.project_membership_set",
      entityType: "ProjectMember",
      entityId: `${project.id}:${user.id}`,
      beforeState: existing
        ? { role: existing.role, archived: existing.archivedAt !== null }
        : { membership: null },
      afterState: { role: input.membershipRole, archived: false },
    });
  });
}

export async function removeProjectMembership(
  actorId: string,
  input: RemoveProjectMembershipInput,
) {
  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const [user, project, existing] = await Promise.all([
      repository.findUser(input.userId),
      repository.findActiveProject(input.projectId),
      repository.findMembership(input.userId, input.projectId),
    ]);

    if (!user || !project || !existing || existing.archivedAt) {
      throw new AccessAdministrationError(
        "The selected project membership is unavailable.",
        "NOT_FOUND",
      );
    }
    if (
      existing.role === "PROJECT_MANAGER" &&
      (await repository.countActiveProjectManagers(project.id)) <= 1
    ) {
      throw new AccessAdministrationError(
        "Assign another Project Manager before removing the last one.",
        "LAST_PROJECT_MANAGER",
      );
    }

    await transaction.projectMember.update({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: user.id,
        },
      },
      data: { archivedAt: new Date() },
    });
    await recordAuditEntry(transaction, {
      actorId,
      projectId: project.id,
      action: "access.project_membership_removed",
      entityType: "ProjectMember",
      entityId: `${project.id}:${user.id}`,
      beforeState: { role: existing.role, archived: false },
      afterState: { role: existing.role, archived: true },
    });
  });
}

export async function setUserAccountStatus(
  actorId: string,
  input: SetAccountStatusInput,
) {
  if (actorId === input.userId && !input.isActive) {
    throw new AccessAdministrationError(
      "You cannot deactivate your own account.",
      "SELF_DEACTIVATION",
    );
  }

  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const user = await repository.findUser(input.userId);

    if (!user) {
      throw new AccessAdministrationError(
        "The selected user is unavailable.",
        "NOT_FOUND",
      );
    }

    const isAdministrator = user.userRoles.some(
      ({ role }) => role.name === "Administrator",
    );

    if (
      !input.isActive &&
      user.isActive &&
      isAdministrator &&
      (await repository.countActiveAdministrators()) <= 1
    ) {
      throw new AccessAdministrationError(
        "The last active Administrator cannot be deactivated.",
        "LAST_ADMINISTRATOR",
      );
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { isActive: input.isActive },
    });

    if (!input.isActive) {
      await transaction.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await recordAuditEntry(transaction, {
      actorId,
      action: input.isActive
        ? "access.user_activated"
        : "access.user_deactivated",
      entityType: "User",
      entityId: user.id,
      beforeState: { isActive: user.isActive },
      afterState: { isActive: input.isActive },
    });
  });
}

export async function updateUserDisplayName(
  actorId: string,
  input: UpdateDisplayNameInput,
) {
  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const user = await repository.findUser(input.userId);

    if (!user) {
      throw new AccessAdministrationError(
        "The selected user is unavailable.",
        "NOT_FOUND",
      );
    }

    const displayName = input.displayName.trim();
    if (displayName === user.displayName) {
      return { changed: false, displayName };
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { displayName },
    });
    await recordAuditEntry(transaction, {
      actorId,
      action: "access.user_display_name_updated",
      entityType: "User",
      entityId: user.id,
      beforeState: { displayName: user.displayName },
      afterState: { displayName },
    });

    return { changed: true, displayName };
  });
}

export async function resetUserPassword(
  actorId: string,
  input: ResetPasswordInput,
) {
  const passwordHash = await hashPassword(input.temporaryPassword);

  return prisma.$transaction(async (transaction) => {
    const repository = new AccessRepository(transaction);
    const user = await repository.findUser(input.userId);

    if (!user) {
      throw new AccessAdministrationError(
        "The selected user is unavailable.",
        "NOT_FOUND",
      );
    }

    const changedAt = new Date();
    await transaction.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: changedAt,
      },
    });
    await transaction.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: changedAt },
    });
    await recordAuditEntry(transaction, {
      actorId,
      action: "access.password_reset",
      entityType: "User",
      entityId: user.id,
      beforeState: { mustChangePassword: user.mustChangePassword },
      afterState: { mustChangePassword: true, activeSessionsRevoked: true },
    });
  });
}
