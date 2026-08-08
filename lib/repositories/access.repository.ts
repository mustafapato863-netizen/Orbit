import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

export class AccessRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  listUsers() {
    return this.database.user.findMany({
      where: { archivedAt: null },
      orderBy: [{ displayName: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          select: { lastSeenAt: true },
          orderBy: { lastSeenAt: "desc" },
          take: 1,
        },
        userRoles: {
          where: { role: { archivedAt: null } },
          select: { role: { select: { id: true, name: true } } },
          orderBy: { role: { name: "asc" } },
        },
        projectMemberships: {
          where: { archivedAt: null },
          select: {
            role: true,
            project: {
              select: { id: true, name: true, code: true, isPrivate: true },
            },
          },
          orderBy: { project: { name: "asc" } },
        },
      },
    });
  }

  listRoles() {
    return this.database.role.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    });
  }

  listProjects() {
    return this.database.project.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, isPrivate: true },
    });
  }

  findActiveRole(roleId: string) {
    return this.database.role.findFirst({
      where: { id: roleId, archivedAt: null },
      select: { id: true, name: true },
    });
  }

  listActiveProjectsByIds(projectIds: string[]) {
    return this.database.project.findMany({
      where: { id: { in: projectIds }, archivedAt: null },
      select: { id: true, name: true, isPrivate: true },
    });
  }

  findActiveProject(projectId: string) {
    return this.database.project.findFirst({
      where: { id: projectId, archivedAt: null },
      select: { id: true, name: true, isPrivate: true },
    });
  }

  findUser(userId: string) {
    return this.database.user.findFirst({
      where: { id: userId, archivedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
        mustChangePassword: true,
        userRoles: {
          where: { role: { archivedAt: null } },
          select: { role: { select: { id: true, name: true } } },
        },
      },
    });
  }

  findMembership(userId: string, projectId: string) {
    return this.database.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true, archivedAt: true },
    });
  }

  countActiveProjectManagers(projectId: string) {
    return this.database.projectMember.count({
      where: {
        projectId,
        role: "PROJECT_MANAGER",
        archivedAt: null,
      },
    });
  }

  countActiveAdministrators() {
    return this.database.user.count({
      where: {
        isActive: true,
        archivedAt: null,
        userRoles: {
          some: { role: { name: "Administrator", archivedAt: null } },
        },
      },
    });
  }
}

export type AccessOverview = {
  users: Awaited<ReturnType<AccessRepository["listUsers"]>>;
  roles: Awaited<ReturnType<AccessRepository["listRoles"]>>;
  projects: Awaited<ReturnType<AccessRepository["listProjects"]>>;
};

export type AccessTransaction = Prisma.TransactionClient;
