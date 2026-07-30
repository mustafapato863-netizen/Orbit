import "server-only";

import { prisma } from "@/lib/prisma";
import { buildWorkstreamView } from "@/lib/workstreams/workstreams";
import { DeliveryPipelineRepository } from "@/lib/repositories/delivery-pipeline.repository";
import { WorkstreamRepository } from "@/lib/repositories/workstream.repository";

export const workstreamQueries = {
  async listProjectWorkstreams(projectId: string) {
    const [project, workstreams] = await Promise.all([
      new DeliveryPipelineRepository(prisma).findProjectPipeline(projectId),
      new WorkstreamRepository(prisma).list(projectId),
    ]);
    return project
      ? workstreams.map((workstream) => buildWorkstreamView(project, workstream))
      : [];
  },
  async getProjectWorkstream(projectId: string, slug: string) {
    const [project, workstream] = await Promise.all([
      new DeliveryPipelineRepository(prisma).findProjectPipeline(projectId),
      new WorkstreamRepository(prisma).findBySlug(projectId, slug),
    ]);
    return project && workstream ? buildWorkstreamView(project, workstream) : null;
  },
};
