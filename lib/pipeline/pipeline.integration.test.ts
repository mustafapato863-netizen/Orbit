import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { createPrismaClient } from "@/lib/prisma-client";
import { buildDeliveryPipeline } from "@/lib/pipeline/pipeline";
import { DeliveryPipelineRepository } from "@/lib/repositories/delivery-pipeline.repository";

describe("seeded PMS Delivery Pipeline projection", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns canonical totals and collapsed Main Milestone summaries", async () => {
    const projectId = await database.project
      .findUnique({
        where: { code: "PMS" },
        select: { id: true },
      })
      .then((project) => project?.id);
    expect(projectId).toBeTruthy();
    if (!projectId) return;

    const project = await database.$transaction((transaction) =>
      new DeliveryPipelineRepository(transaction).findProjectPipeline(
        projectId,
      ),
    );
    expect(project).not.toBeNull();
    if (!project) return;

    const pipeline = buildDeliveryPipeline(project);
    expect(project.milestones).toHaveLength(14);
    expect(project.sharedCapabilities).toHaveLength(0);
    expect(pipeline.totalCanonicalPackages).toBe(108);
    expect(pipeline.atRiskCount).toBe(13);
    expect(pipeline.stageCounts).toEqual({
      NOT_STARTED: 11,
      IN_DEVELOPMENT: 41,
      TECHNICAL_VERIFICATION: 20,
      BUSINESS_UAT: 3,
      STAGING: 15,
      CONTROLLED_PILOT: 2,
      PRODUCTION: 16,
    });
    expect(
      Object.fromEntries(
        pipeline.milestones
          .filter(({ code }) => code.startsWith("PH-"))
          .map(({ code, specificWorkCount }) => [code, specificWorkCount]),
      ),
    ).toEqual({
      "PH-01": 7,
      "PH-02": 8,
      "PH-03": 10,
      "PH-04": 12,
      "PH-05": 14,
      "PH-06": 12,
      "PH-07": 10,
    });
    expect(
      pipeline.milestones.find(({ code }) => code === "BPH-03")
        ?.specificWorkCount,
    ).toBe(8);
    expect(
      pipeline.milestones.reduce(
        (total, milestone) =>
          total + milestone.sharedDependencyCount,
        0,
      ),
    ).toBe(0);
  });
});
