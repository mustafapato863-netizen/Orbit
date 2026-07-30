import "server-only";

import { prisma } from "@/lib/prisma";
import { ReportRepository } from "@/lib/reports/report.repository";

export const reportQueries = {
  async getWorkspace(projectId: string) {
    const repository = new ReportRepository(prisma);
    const [project, snapshots] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, archivedAt: null },
        select: { id: true, code: true, name: true, status: true },
      }),
      repository.listSnapshots(projectId),
    ]);
    return { project, snapshots };
  },
};
