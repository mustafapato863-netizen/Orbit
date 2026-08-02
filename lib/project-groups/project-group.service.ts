import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { recordAuditEntry } from "@/lib/audit/audit.service";
import { prisma } from "@/lib/prisma";
import type {
  CreateProjectGroupInput,
  UpdateProjectGroupInput,
} from "@/lib/project-groups/project-group.schemas";

export class ProjectGroupDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "DUPLICATE"
      | "PROJECT_NOT_FOUND"
      | "ARCHIVED",
  ) {
    super(message);
    this.name = "ProjectGroupDomainError";
  }
}

const groupSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  colorToken: true,
  sortOrder: true,
  projects: {
    where: { archivedAt: null },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      progress: true,
      isPrivate: true,
    },
  },
} satisfies Prisma.ProjectGroupSelect;

function slugifyGroup(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);

  return slug || "project-group";
}

function groupState(group: {
  name: string;
  slug: string;
  description: string | null;
  colorToken: string;
  sortOrder: number;
  projectIds?: string[];
}) {
  return {
    name: group.name,
    slug: group.slug,
    description: group.description,
    colorToken: group.colorToken,
    sortOrder: group.sortOrder,
    ...(group.projectIds ? { projectIds: group.projectIds } : {}),
  };
}

function normalizeDescription(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

async function assertProjectsExist(
  database: Prisma.TransactionClient,
  projectIds: string[],
) {
  if (!projectIds.length) return;

  const count = await database.project.count({
    where: { id: { in: projectIds }, archivedAt: null },
  });
  if (count !== new Set(projectIds).size) {
    throw new ProjectGroupDomainError(
      "One or more selected projects could not be found.",
      "PROJECT_NOT_FOUND",
    );
  }
}

async function uniqueSlug(
  database: Prisma.TransactionClient,
  name: string,
  excludedGroupId?: string,
) {
  const base = slugifyGroup(name);
  let candidate = base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const existing = await database.projectGroup.findFirst({
      where: {
        slug: candidate,
        ...(excludedGroupId ? { NOT: { id: excludedGroupId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base.slice(0, 150 - String(suffix).length - 1)}-${suffix}`;
  }

  throw new ProjectGroupDomainError(
    "A unique group reference could not be generated.",
    "DUPLICATE",
  );
}

async function syncProjectAssignments(
  database: Prisma.TransactionClient,
  groupId: string,
  projectIds: string[],
) {
  await assertProjectsExist(database, projectIds);
  const selectedIds = [...new Set(projectIds)];

  await database.project.updateMany({
    where: {
      projectGroupId: groupId,
      ...(selectedIds.length ? { id: { notIn: selectedIds } } : {}),
      archivedAt: null,
    },
    data: { projectGroupId: null },
  });

  if (selectedIds.length) {
    await database.project.updateMany({
      where: { id: { in: selectedIds }, archivedAt: null },
      data: { projectGroupId: groupId },
    });
  }
}

export const projectGroupQueries = {
  listActiveGroups() {
    return prisma.projectGroup.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: groupSelect,
    });
  },
};

async function transaction<T>(
  operation: (database: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        (database) => operation(database),
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;

      if ((errorCode === "P2034" || errorCode === "P2002") && attempt < 2) {
        continue;
      }
      if (errorCode === "P2002") {
        throw new ProjectGroupDomainError(
          "A group with that name already exists.",
          "DUPLICATE",
        );
      }
      throw error;
    }
  }

  throw new Error("Project group transaction retry limit reached.");
}

export const projectGroupCommands = {
  create(actorId: string, input: CreateProjectGroupInput) {
    return transaction(async (database) => {
      await assertProjectsExist(database, input.projectIds);
      const group = await database.projectGroup.create({
        data: {
          name: input.name.trim(),
          slug: await uniqueSlug(database, input.name),
          description: normalizeDescription(input.description),
          colorToken: input.colorToken,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          colorToken: true,
          sortOrder: true,
        },
      });
      await syncProjectAssignments(database, group.id, input.projectIds);
      await recordAuditEntry(database, {
        actorId,
        action: "project_group.created",
        entityType: "ProjectGroup",
        entityId: group.id,
        afterState: groupState({ ...group, projectIds: input.projectIds }),
      });
      return group;
    });
  },

  update(actorId: string, input: UpdateProjectGroupInput) {
    return transaction(async (database) => {
      const existing = await database.projectGroup.findFirst({
        where: { id: input.groupId, archivedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          colorToken: true,
          sortOrder: true,
          projects: {
            where: { archivedAt: null },
            select: { id: true },
          },
        },
      });
      if (!existing) {
        throw new ProjectGroupDomainError("Project group not found.", "NOT_FOUND");
      }

      await assertProjectsExist(database, input.projectIds);
      const updated = await database.projectGroup.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim(),
          slug:
            input.name.trim() === existing.name
              ? existing.slug
              : await uniqueSlug(database, input.name, existing.id),
          description: normalizeDescription(input.description),
          colorToken: input.colorToken,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          colorToken: true,
          sortOrder: true,
        },
      });
      await syncProjectAssignments(database, existing.id, input.projectIds);
      await recordAuditEntry(database, {
        actorId,
        action: "project_group.updated",
        entityType: "ProjectGroup",
        entityId: existing.id,
        beforeState: groupState({
          ...existing,
          projectIds: existing.projects.map((project) => project.id),
        }),
        afterState: groupState({ ...updated, projectIds: input.projectIds }),
      });
      return updated;
    });
  },

  archive(actorId: string, groupId: string) {
    return transaction(async (database) => {
      const existing = await database.projectGroup.findFirst({
        where: { id: groupId, archivedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          colorToken: true,
          sortOrder: true,
          projects: {
            where: { archivedAt: null },
            select: { id: true },
          },
        },
      });
      if (!existing) {
        throw new ProjectGroupDomainError("Project group not found.", "NOT_FOUND");
      }

      const archivedAt = new Date();
      await database.project.updateMany({
        where: { projectGroupId: existing.id, archivedAt: null },
        data: { projectGroupId: null },
      });
      await database.projectGroup.update({
        where: { id: existing.id },
        data: { archivedAt },
      });
      await recordAuditEntry(database, {
        actorId,
        action: "project_group.archived",
        entityType: "ProjectGroup",
        entityId: existing.id,
        beforeState: groupState({
          ...existing,
          projectIds: existing.projects.map((project) => project.id),
        }),
        afterState: {
          ...groupState({ ...existing, projectIds: [] }),
          archivedAt: archivedAt.toISOString(),
        },
      });
    });
  },
};

