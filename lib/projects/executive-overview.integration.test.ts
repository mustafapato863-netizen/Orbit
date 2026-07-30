import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { createPrismaClient } from "@/lib/prisma-client";
import { buildExecutiveOverview } from "@/lib/projects/executive-overview";
import { ProjectRepository } from "@/lib/repositories/project.repository";

describe("PMS executive overview projection", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("derives the seeded overview from canonical project records", async () => {
    const pmsProject = await database.project.findUnique({
      where: { code: "PMS" },
      select: { id: true },
    });
    expect(pmsProject).not.toBeNull();
    if (!pmsProject) return;

    const project = await database.$transaction((transaction) =>
      new ProjectRepository(transaction).findProjectDetails(pmsProject.id),
    );
    expect(project).not.toBeNull();
    if (!project) return;

    const overview = buildExecutiveOverview(
      project,
      new Date("2026-07-25T00:00:00.000Z"),
    );
    const capabilityLinkCount = project.milestones.reduce(
      (total, milestone) =>
        total + milestone.sharedCapabilityLinks.length,
      0,
    );

    expect(project.milestones).toHaveLength(14);
    expect(project.sharedCapabilities).toHaveLength(0);
    expect(capabilityLinkCount).toBe(0);
    expect(overview).toMatchObject({
      derivedPlanningProgress: 66,
      totalMilestones: 14,
      highRiskMilestones: 6,
      blockedItems: 13,
      currentReleaseGate: "IN_DEVELOPMENT",
      releaseOne: { total: 14, progress: 66, status: "AT_RISK" },
      phaseTwo: { total: 0, progress: 0, status: "NOT_PLANNED" },
    });
    expect(
      overview.blockers.some(
        ({ code }) => code === "PH-03",
      ),
    ).toBe(true);
  });
});
