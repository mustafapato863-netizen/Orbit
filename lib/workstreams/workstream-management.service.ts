import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import { nextSequenceCode } from "@/lib/projects/code-generation";
import { slugifyProject } from "@/lib/projects/project.utils";
import { prisma } from "@/lib/prisma";
import { WorkstreamRepository } from "@/lib/repositories/workstream.repository";
import type {
  CreateWorkstreamInput,
  UpdateWorkstreamInput,
} from "@/lib/workstreams/workstream.schemas";

export class WorkstreamDomainError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "DUPLICATE" | "IN_USE",
  ) {
    super(message);
    this.name = "WorkstreamDomainError";
  }
}

function values(input: CreateWorkstreamInput | UpdateWorkstreamInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    colorToken: input.colorToken.toLowerCase(),
    iconKey: input.iconKey,
    sortOrder: input.sortOrder,
  };
}

class WorkstreamService {
  private readonly repository: WorkstreamRepository;

  constructor(private readonly database: Prisma.TransactionClient) {
    this.repository = new WorkstreamRepository(database);
  }

  async create(actorId: string, input: CreateWorkstreamInput) {
    const codes = await this.repository.listCodes(input.projectId);
    const code = nextSequenceCode("WS", codes.map((entry) => entry.code));
    const created = await this.repository.create({
      projectId: input.projectId,
      code,
      slug: slugifyProject(input.name, code),
      ...values(input),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "workstream.created",
      entityType: "Workstream",
      entityId: created.id,
      afterState: created,
    });
    return created;
  }

  async update(actorId: string, input: UpdateWorkstreamInput) {
    const existing = await this.repository.find(input.projectId, input.workstreamId);
    if (!existing) throw new WorkstreamDomainError("Workstream not found.", "NOT_FOUND");
    const updated = await this.repository.update(existing.id, {
      ...values(input),
      slug: slugifyProject(input.name, existing.code),
    });
    await recordAuditEntry(this.database, {
      actorId,
      projectId: input.projectId,
      action: "workstream.updated",
      entityType: "Workstream",
      entityId: updated.id,
      beforeState: existing,
      afterState: updated,
    });
    return updated;
  }

  async archive(actorId: string, projectId: string, workstreamId: string) {
    const existing = await this.repository.find(projectId, workstreamId);
    if (!existing) throw new WorkstreamDomainError("Workstream not found.", "NOT_FOUND");
    if (await this.repository.usageCount(workstreamId)) {
      throw new WorkstreamDomainError(
        "Move or archive the work assigned to this workstream first.",
        "IN_USE",
      );
    }
    await this.repository.update(workstreamId, { archivedAt: new Date() });
    await recordAuditEntry(this.database, {
      actorId,
      projectId,
      action: "workstream.archived",
      entityType: "Workstream",
      entityId: workstreamId,
      beforeState: existing,
      afterState: { ...existing, archivedAt: new Date().toISOString() },
    });
  }
}

async function transaction<T>(operation: (service: WorkstreamService) => Promise<T>) {
  try {
    return await prisma.$transaction(
      (database) => operation(new WorkstreamService(database)),
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new WorkstreamDomainError(
        "A workstream with that name already exists in this project.",
        "DUPLICATE",
      );
    }
    throw error;
  }
}

export const workstreamCommands = {
  create: (actorId: string, input: CreateWorkstreamInput) =>
    transaction((service) => service.create(actorId, input)),
  update: (actorId: string, input: UpdateWorkstreamInput) =>
    transaction((service) => service.update(actorId, input)),
  archive: (actorId: string, projectId: string, workstreamId: string) =>
    transaction((service) => service.archive(actorId, projectId, workstreamId)),
};

export const workstreamManagementQueries = {
  list: (projectId: string) => new WorkstreamRepository(prisma).list(projectId),
  get: (projectId: string, workstreamId: string) =>
    new WorkstreamRepository(prisma).find(projectId, workstreamId),
};
