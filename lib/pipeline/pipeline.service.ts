import "server-only";

import { prisma } from "@/lib/prisma";
import { DeliveryPipelineRepository } from "@/lib/repositories/delivery-pipeline.repository";

export const pipelineQueries = {
  getProjectPipeline: (projectId: string) =>
    new DeliveryPipelineRepository(prisma).findProjectPipeline(projectId),
};
