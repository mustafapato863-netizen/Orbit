import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";

const OUTPUT_DIRECTORY = path.resolve("deliverables");
const OUTPUT_FILE = path.join(
  OUTPUT_DIRECTORY,
  "pms-dashboard-roadmap-data.json",
);

function dateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

async function main() {
  const env = parseServerEnv(process.env);
  const database = createPrismaClient(env.DATABASE_URL);

  try {
    const project = await database.project.findUnique({
      where: { code: "PMS" },
      select: {
        code: true,
        slug: true,
        name: true,
        description: true,
        status: true,
        progress: true,
        startDate: true,
        targetDate: true,
        milestones: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
          select: {
            code: true,
            name: true,
            businessPurpose: true,
            status: true,
            progress: true,
            riskLevel: true,
            deliveryStage: true,
            releaseHorizon: true,
            sortOrder: true,
            startDate: true,
            dueDate: true,
            deliveredScope: true,
            remainingScope: true,
            currentBlockers: true,
            nextAction: true,
            firstReleaseImpact: true,
            workItems: {
              where: { archivedAt: null },
              orderBy: [{ startDate: "asc" }, { code: "asc" }],
              select: {
                code: true,
                name: true,
                description: true,
                acceptanceCriteria: true,
                notes: true,
                status: true,
                progress: true,
                riskLevel: true,
                deliveryStage: true,
                lifecycleStage: true,
                deliveryHealth: true,
                deploymentEnvironment: true,
                releaseScope: true,
                startDate: true,
                dueDate: true,
                plannedStartDate: true,
                plannedCheckDate: true,
                plannedProductionReadyDate: true,
                plannedGoLiveDate: true,
                actualStartDate: true,
                actualCheckDate: true,
                actualProductionReadyDate: true,
                actualGoLiveDate: true,
                nextGate: true,
                nextAction: true,
                blocker: true,
                blockerSummary: true,
                implementationNotes: true,
                primaryWorkstream: {
                  select: { code: true },
                },
                supportingWorkstreams: {
                  orderBy: { workstream: { code: "asc" } },
                  select: {
                    workstream: {
                      select: { code: true },
                    },
                  },
                },
                owner: {
                  select: {
                    email: true,
                    displayName: true,
                  },
                },
                checkpoints: {
                  orderBy: { checkpointCode: "asc" },
                  select: {
                    checkpointCode: true,
                    plannedDate: true,
                    actualDate: true,
                    status: true,
                    note: true,
                  },
                },
              },
            },
            sharedCapabilityLinks: {
              where: { sharedCapability: { archivedAt: null } },
              orderBy: { sharedCapability: { code: "asc" } },
              select: {
                sourceReference: true,
                dependencyNotes: true,
                isCritical: true,
                sharedCapability: {
                  select: { code: true },
                },
              },
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          orderBy: { code: "asc" },
          select: {
            code: true,
            name: true,
            description: true,
            acceptanceCriteria: true,
            notes: true,
            status: true,
            progress: true,
            riskLevel: true,
            deliveryStage: true,
            startDate: true,
            dueDate: true,
            nextGate: true,
            blocker: true,
            primaryWorkstream: {
              select: { code: true },
            },
            supportingWorkstreams: {
              orderBy: { workstream: { code: "asc" } },
              select: {
                workstream: {
                  select: { code: true },
                },
              },
            },
            owner: {
              select: {
                email: true,
                displayName: true,
              },
            },
            milestoneLinks: {
              where: { milestone: { archivedAt: null } },
              orderBy: { milestone: { code: "asc" } },
              select: {
                sourceReference: true,
                dependencyNotes: true,
                isCritical: true,
                milestone: {
                  select: { code: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error("PMS Dashboard project was not found.");
    }

    const document = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      editingNotes: [
        "Keep project, phase, work-item, and capability codes unique.",
        "Use YYYY-MM-DD for dates and null when a date is not set.",
        "Progress must be an integer from 0 to 100.",
        "Do not rename keys. Edit values or add new phase/work-item objects using the same shape.",
      ],
      allowedValues: {
        phaseType: ["TECHNICAL", "BUSINESS"],
        status: [
          "NOT_STARTED",
          "IN_PROGRESS",
          "AT_RISK",
          "BLOCKED",
          "COMPLETED",
        ],
        riskLevel: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        deliveryStage: [
          "NOT_STARTED",
          "IN_DEVELOPMENT",
          "TECHNICAL_VERIFICATION",
          "BUSINESS_UAT",
          "STAGING",
          "CONTROLLED_PILOT",
          "PRODUCTION",
        ],
        lifecycleStage: ["NS", "IP", "CHK", "RPR", "LIVE"],
        deliveryHealth: ["ON_TRACK", "AT_RISK", "OVERDUE"],
        workstream: ["FRONTEND", "BACKEND", "DATABASE"],
        releaseHorizon: ["RELEASE_1", "PHASE_2"],
      },
      project: {
        code: project.code,
        slug: project.slug,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        startDate: dateOnly(project.startDate),
        targetDate: dateOnly(project.targetDate),
      },
      phases: project.milestones.map((phase) => ({
        code: phase.code,
        phaseType: phase.code.startsWith("BPH-")
          ? ("BUSINESS" as const)
          : ("TECHNICAL" as const),
        name: phase.name,
        businessPurpose: phase.businessPurpose,
        status: phase.status,
        progress: phase.progress,
        riskLevel: phase.riskLevel,
        deliveryStage: phase.deliveryStage,
        releaseHorizon: phase.releaseHorizon,
        sortOrder: phase.sortOrder,
        startDate: dateOnly(phase.startDate),
        dueDate: dateOnly(phase.dueDate),
        deliveredScope: phase.deliveredScope,
        remainingScope: phase.remainingScope,
        currentBlockers: phase.currentBlockers,
        nextAction: phase.nextAction,
        firstReleaseImpact: phase.firstReleaseImpact,
        workItems: phase.workItems.map((item) => ({
          code: item.code,
          name: item.name,
          description: item.description,
          acceptanceCriteria: item.acceptanceCriteria,
          notes: item.notes,
          status: item.status,
          progress: item.progress,
          riskLevel: item.riskLevel,
          deliveryStage: item.deliveryStage,
          lifecycleStage: item.lifecycleStage,
          deliveryHealth: item.deliveryHealth,
          deploymentEnvironment: item.deploymentEnvironment,
          releaseScope: item.releaseScope,
          startDate: dateOnly(item.startDate),
          dueDate: dateOnly(item.dueDate),
          plannedDates: {
            start: dateOnly(item.plannedStartDate),
            check: dateOnly(item.plannedCheckDate),
            productionReady: dateOnly(item.plannedProductionReadyDate),
            goLive: dateOnly(item.plannedGoLiveDate),
          },
          actualDates: {
            start: dateOnly(item.actualStartDate),
            check: dateOnly(item.actualCheckDate),
            productionReady: dateOnly(item.actualProductionReadyDate),
            goLive: dateOnly(item.actualGoLiveDate),
          },
          nextGate: item.nextGate,
          nextAction: item.nextAction,
          blocker: item.blocker,
          blockerSummary: item.blockerSummary,
          implementationNotes: item.implementationNotes,
          primaryWorkstream: item.primaryWorkstream.code,
          supportingWorkstreams: item.supportingWorkstreams.map(
            ({ workstream }) => workstream.code,
          ),
          owner: item.owner
            ? {
                email: item.owner.email,
                displayName: item.owner.displayName,
              }
            : null,
          checkpoints: item.checkpoints.map((checkpoint) => ({
            code: checkpoint.checkpointCode,
            plannedDate: dateOnly(checkpoint.plannedDate),
            actualDate: dateOnly(checkpoint.actualDate),
            status: checkpoint.status,
            note: checkpoint.note,
          })),
        })),
        sharedCapabilities: phase.sharedCapabilityLinks.map((link) => ({
          code: link.sharedCapability.code,
          sourceReference: link.sourceReference,
          dependencyNotes: link.dependencyNotes,
          isCritical: link.isCritical,
        })),
      })),
      sharedCapabilities: project.sharedCapabilities.map((capability) => ({
        code: capability.code,
        name: capability.name,
        description: capability.description,
        acceptanceCriteria: capability.acceptanceCriteria,
        notes: capability.notes,
        status: capability.status,
        progress: capability.progress,
        riskLevel: capability.riskLevel,
        deliveryStage: capability.deliveryStage,
        startDate: dateOnly(capability.startDate),
        dueDate: dateOnly(capability.dueDate),
        nextGate: capability.nextGate,
        blocker: capability.blocker,
        primaryWorkstream: capability.primaryWorkstream.code,
        supportingWorkstreams: capability.supportingWorkstreams.map(
          ({ workstream }) => workstream.code,
        ),
        owner: capability.owner
          ? {
              email: capability.owner.email,
              displayName: capability.owner.displayName,
            }
          : null,
        linkedPhases: capability.milestoneLinks.map((link) => ({
          code: link.milestone.code,
          sourceReference: link.sourceReference,
          dependencyNotes: link.dependencyNotes,
          isCritical: link.isCritical,
        })),
      })),
    };

    await mkdir(OUTPUT_DIRECTORY, { recursive: true });
    await writeFile(OUTPUT_FILE, `${JSON.stringify(document, null, 2)}\n`, {
      encoding: "utf8",
    });

    console.info(
      `Exported PMS Dashboard roadmap JSON (${document.phases.length} phases, ${document.phases.reduce((total, phase) => total + phase.workItems.length, 0)} work items).`,
    );
  } finally {
    await database.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "PMS Dashboard roadmap export failed.",
  );
  process.exitCode = 1;
});
