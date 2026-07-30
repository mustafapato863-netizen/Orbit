import type { Prisma } from "@/generated/prisma/client";
import { Repository } from "@/lib/repositories/repository";

const selection = {
  id: true,
  projectId: true,
  code: true,
  slug: true,
  name: true,
  description: true,
  colorToken: true,
  iconKey: true,
  sortOrder: true,
  archivedAt: true,
} satisfies Prisma.WorkstreamSelect;

export class WorkstreamRepository extends Repository {
  constructor(database: Prisma.TransactionClient) {
    super(database);
  }

  list(projectId: string, includeArchived = false) {
    return this.database.workstream.findMany({
      where: {
        projectId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: selection,
    });
  }

  find(projectId: string, workstreamId: string) {
    return this.database.workstream.findFirst({
      where: { id: workstreamId, projectId, archivedAt: null },
      select: selection,
    });
  }

  findBySlug(projectId: string, slug: string) {
    return this.database.workstream.findFirst({
      where: { projectId, slug, archivedAt: null },
      select: selection,
    });
  }

  listCodes(projectId: string) {
    return this.database.workstream.findMany({
      where: { projectId },
      select: { code: true },
    });
  }

  create(data: Prisma.WorkstreamUncheckedCreateInput) {
    return this.database.workstream.create({ data, select: selection });
  }

  update(workstreamId: string, data: Prisma.WorkstreamUncheckedUpdateInput) {
    return this.database.workstream.update({
      where: { id: workstreamId },
      data,
      select: selection,
    });
  }

  async usageCount(workstreamId: string) {
    const [primaryItems, supportingItems, primaryShared, supportingShared, risks, decisions] =
      await Promise.all([
        this.database.workItem.count({ where: { primaryWorkstreamId: workstreamId, archivedAt: null } }),
        this.database.workItemWorkstream.count({ where: { workstreamId, workItem: { archivedAt: null } } }),
        this.database.sharedCapability.count({ where: { primaryWorkstreamId: workstreamId, archivedAt: null } }),
        this.database.sharedCapabilityWorkstream.count({ where: { workstreamId, sharedCapability: { archivedAt: null } } }),
        this.database.risk.count({ where: { primaryWorkstreamId: workstreamId, archivedAt: null } }),
        this.database.decisionWorkstream.count({ where: { workstreamId, decision: { archivedAt: null } } }),
      ]);
    return primaryItems + supportingItems + primaryShared + supportingShared + risks + decisions;
  }
}
