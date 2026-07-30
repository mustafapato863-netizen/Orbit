import "dotenv/config";

import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";
import {
  pmsMilestoneSeeds,
  pmsWorkItemSeeds,
} from "../prisma/pms-seed-data";

async function main() {
  const env = parseServerEnv(process.env);
  const database = createPrismaClient(env.DATABASE_URL);

  try {
    const project = await database.project.findUnique({
      where: { code: "PMS" },
      select: {
        milestones: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
          select: {
            code: true,
            progress: true,
            startDate: true,
            dueDate: true,
            workItems: {
              where: { archivedAt: null },
              select: { code: true, deliveryStage: true },
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          select: { id: true },
        },
      },
    });

    if (!project) throw new Error("PMS project was not found.");

    const expectedTechnicalPhases = pmsMilestoneSeeds.filter(({ code }) =>
      code.startsWith("PH-"),
    );
    const actualTechnicalPhases = project.milestones.filter(({ code }) =>
      code.startsWith("PH-"),
    );
    const actualBusinessPhases = project.milestones.filter(({ code }) =>
      code.startsWith("BPH-"),
    );

    const expected = expectedTechnicalPhases.map((phase) => ({
      code: phase.code,
      progress: phase.progress,
      startDate: phase.startDate,
      dueDate: phase.dueDate,
      workItemCodes: pmsWorkItemSeeds
        .filter(({ milestoneCode }) => milestoneCode === phase.code)
        .map(({ code }) => code)
        .sort(),
    }));
    const actual = actualTechnicalPhases.map((phase) => ({
      code: phase.code,
      progress: phase.progress,
      startDate: phase.startDate?.toISOString().slice(0, 10) ?? null,
      dueDate: phase.dueDate?.toISOString().slice(0, 10) ?? null,
      workItemCodes: phase.workItems.map(({ code }) => code).sort(),
    }));

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `PMS technical planning verification failed: ${JSON.stringify(actual)}`,
      );
    }
    if (actualBusinessPhases.length !== 7) {
      throw new Error(
        `Expected seven preserved business phases, found ${actualBusinessPhases.length}.`,
      );
    }

    const allItems = project.milestones.flatMap(({ workItems }) => workItems);
    const gateCount = actualTechnicalPhases.reduce(
      (total, phase) =>
        total + phase.workItems.filter(({ code }) => code.endsWith(".GATE")).length,
      0,
    );
    if (gateCount !== 7) {
      throw new Error(`Expected seven technical verification gates, found ${gateCount}.`);
    }

    const stageCounts = Object.groupBy(
      allItems,
      ({ deliveryStage }) => deliveryStage,
    );
    console.info(
      JSON.stringify(
        {
          activePhases: project.milestones.length,
          technicalPhases: actualTechnicalPhases.length,
          businessPhases: actualBusinessPhases.length,
          activeWorkItems: allItems.length,
          technicalWorkItems: actualTechnicalPhases.reduce(
            (total, phase) => total + phase.workItems.length,
            0,
          ),
          preservedBusinessWorkItems: actualBusinessPhases.reduce(
            (total, phase) => total + phase.workItems.length,
            0,
          ),
          verificationGates: gateCount,
          sharedCapabilities: project.sharedCapabilities.length,
          stageCounts: Object.fromEntries(
            Object.entries(stageCounts).map(([stage, items]) => [
              stage,
              items?.length ?? 0,
            ]),
          ),
        },
        null,
        2,
      ),
    );
  } finally {
    await database.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "PMS planning verification failed.",
  );
  process.exitCode = 1;
});
