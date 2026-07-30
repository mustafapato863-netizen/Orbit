import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";
import {
  buildBusinessArchivePlan,
  buildTechnicalArchivePlan,
  documentCountsForImport,
  phasesForImport,
  storedCountsForImport,
  type RoadmapImportScope,
} from "./roadmap-import-scope";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value,
    "Invalid calendar date.",
  );
const nullableDateSchema = dateOnlySchema.nullable();
const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();
const codeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/);

const projectStatusSchema = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "AT_RISK",
  "COMPLETED",
]);
const milestoneStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "AT_RISK",
  "BLOCKED",
  "COMPLETED",
]);
const workItemStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "AT_RISK",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);
const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const deliveryStageSchema = z.enum([
  "NOT_STARTED",
  "IN_DEVELOPMENT",
  "TECHNICAL_VERIFICATION",
  "BUSINESS_UAT",
  "STAGING",
  "CONTROLLED_PILOT",
  "PRODUCTION",
]);
const lifecycleStageSchema = z.enum(["NS", "IP", "CHK", "RPR", "LIVE"]);
const deliveryHealthSchema = z.enum([
  "ON_TRACK",
  "AT_RISK",
  "BLOCKED",
  "OVERDUE",
]);
const workstreamSchema = z.enum(["FRONTEND", "BACKEND", "DATABASE"]);
const releaseHorizonSchema = z.enum(["RELEASE_1", "PHASE_2"]);
const deploymentEnvironmentSchema = z.enum([
  "LOCAL",
  "STAGING",
  "PRODUCTION",
]);
const releaseScopeSchema = z.enum(["INTERNAL", "PILOT", "FULL_RELEASE"]);

const ownerSchema = z.union([
  z.string().trim().max(240),
  z.object({
    email: z.email(),
    displayName: z.string().trim().max(160).nullable().optional(),
  }),
  z.null(),
]);

const checkpointSchema = z.object({
  code: codeSchema,
  plannedDate: nullableDateSchema,
  actualDate: nullableDateSchema,
  status: z.string().trim().min(1).max(40),
  note: nullableText(10_000),
});

const workItemSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(2).max(240),
  description: nullableText(10_000),
  acceptanceCriteria: nullableText(20_000),
  notes: nullableText(10_000),
  status: workItemStatusSchema,
  progress: z.number().int().min(0).max(100),
  riskLevel: riskLevelSchema,
  deliveryStage: deliveryStageSchema,
  lifecycleStage: lifecycleStageSchema,
  deliveryHealth: deliveryHealthSchema,
  deploymentEnvironment: deploymentEnvironmentSchema,
  releaseScope: releaseScopeSchema,
  startDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  plannedDates: z.object({
    start: nullableDateSchema,
    check: nullableDateSchema,
    productionReady: nullableDateSchema,
    goLive: nullableDateSchema,
  }),
  actualDates: z.object({
    start: nullableDateSchema,
    check: nullableDateSchema,
    productionReady: nullableDateSchema,
    goLive: nullableDateSchema,
  }),
  nextGate: nullableText(240),
  nextAction: nullableText(10_000),
  blocker: nullableText(10_000),
  blockerSummary: nullableText(10_000),
  implementationNotes: nullableText(10_000),
  primaryWorkstream: workstreamSchema,
  supportingWorkstreams: z.array(workstreamSchema).max(2),
  owner: ownerSchema,
  checkpoints: z.array(checkpointSchema),
});

const capabilityLinkSchema = z.object({
  code: codeSchema,
  sourceReference: nullableText(500),
  dependencyNotes: nullableText(10_000),
  isCritical: z.boolean(),
});

const phaseSchema = z.object({
  code: codeSchema,
  phaseType: z.enum(["TECHNICAL", "BUSINESS"]),
  name: z.string().trim().min(2).max(200),
  businessPurpose: nullableText(10_000),
  status: milestoneStatusSchema,
  progress: z.number().int().min(0).max(100),
  riskLevel: riskLevelSchema,
  deliveryStage: deliveryStageSchema,
  releaseHorizon: releaseHorizonSchema,
  sortOrder: z.number().int().min(0),
  startDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  deliveredScope: nullableText(10_000),
  remainingScope: nullableText(10_000),
  currentBlockers: nullableText(10_000),
  nextAction: nullableText(10_000),
  firstReleaseImpact: nullableText(10_000),
  workItems: z.array(workItemSchema),
  sharedCapabilities: z.array(capabilityLinkSchema),
});

const sharedCapabilitySchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(2).max(240),
  description: nullableText(10_000),
  acceptanceCriteria: nullableText(20_000),
  notes: nullableText(10_000),
  status: workItemStatusSchema,
  progress: z.number().int().min(0).max(100),
  riskLevel: riskLevelSchema,
  deliveryStage: deliveryStageSchema,
  startDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  nextGate: nullableText(240),
  blocker: nullableText(10_000),
  primaryWorkstream: workstreamSchema,
  supportingWorkstreams: z.array(workstreamSchema).max(2),
  owner: ownerSchema,
  linkedPhases: z.array(
    z.object({
      code: codeSchema,
      sourceReference: nullableText(500),
      dependencyNotes: nullableText(10_000),
      isCritical: z.boolean(),
    }),
  ),
});

const roadmapSchema = z
  .object({
    schemaVersion: z.literal(1),
    project: z.object({
      code: z.literal("PMS"),
      slug: z.literal("pms-dashboard"),
      name: z.string().trim().min(2).max(200),
      description: nullableText(5_000),
      status: projectStatusSchema,
      progress: z.number().int().min(0).max(100),
      startDate: nullableDateSchema,
      targetDate: nullableDateSchema,
    }),
    phases: z.array(phaseSchema).min(1),
    sharedCapabilities: z.array(sharedCapabilitySchema),
  })
  .superRefine((document, context) => {
    const phaseCodes = document.phases.map(({ code }) => code);
    if (new Set(phaseCodes).size !== phaseCodes.length) {
      context.addIssue({
        code: "custom",
        message: "Phase codes must be unique.",
        path: ["phases"],
      });
    }

    const itemCodes = document.phases.flatMap(({ workItems }) =>
      workItems.map(({ code }) => code),
    );
    if (new Set(itemCodes).size !== itemCodes.length) {
      context.addIssue({
        code: "custom",
        message: "Work-item codes must be unique across the PMS project.",
        path: ["phases"],
      });
    }

    const capabilityCodes = document.sharedCapabilities.map(({ code }) => code);
    if (new Set(capabilityCodes).size !== capabilityCodes.length) {
      context.addIssue({
        code: "custom",
        message: "Shared-capability codes must be unique.",
        path: ["sharedCapabilities"],
      });
    }

    const knownPhases = new Set(phaseCodes);
    const knownCapabilities = new Set(capabilityCodes);
    for (const [phaseIndex, phase] of document.phases.entries()) {
      const expectedType = phase.code.startsWith("BPH-")
        ? "BUSINESS"
        : "TECHNICAL";
      if (phase.phaseType !== expectedType) {
        context.addIssue({
          code: "custom",
          message: `${phase.code} must use phaseType ${expectedType}.`,
          path: ["phases", phaseIndex, "phaseType"],
        });
      }
      validateDateRange(
        phase.startDate,
        phase.dueDate,
        context,
        ["phases", phaseIndex, "dueDate"],
      );
      const linkedCodes = phase.sharedCapabilities.map(({ code }) => code);
      if (
        new Set(linkedCodes).size !== linkedCodes.length ||
        linkedCodes.some((code) => !knownCapabilities.has(code))
      ) {
        context.addIssue({
          code: "custom",
          message: `${phase.code} contains duplicate or unknown capability links.`,
          path: ["phases", phaseIndex, "sharedCapabilities"],
        });
      }

      for (const [itemIndex, item] of phase.workItems.entries()) {
        validateDateRange(
          item.startDate,
          item.dueDate,
          context,
          ["phases", phaseIndex, "workItems", itemIndex, "dueDate"],
        );
        if (
          new Set(item.supportingWorkstreams).size !==
            item.supportingWorkstreams.length ||
          item.supportingWorkstreams.includes(item.primaryWorkstream)
        ) {
          context.addIssue({
            code: "custom",
            message:
              "Supporting workstreams must be unique and exclude the Primary Workstream.",
            path: [
              "phases",
              phaseIndex,
              "workItems",
              itemIndex,
              "supportingWorkstreams",
            ],
          });
        }
        const checkpointCodes = item.checkpoints.map(({ code }) => code);
        if (new Set(checkpointCodes).size !== checkpointCodes.length) {
          context.addIssue({
            code: "custom",
            message: "Checkpoint codes must be unique within a work item.",
            path: [
              "phases",
              phaseIndex,
              "workItems",
              itemIndex,
              "checkpoints",
            ],
          });
        }
      }
    }

    for (const [index, capability] of document.sharedCapabilities.entries()) {
      validateDateRange(
        capability.startDate,
        capability.dueDate,
        context,
        ["sharedCapabilities", index, "dueDate"],
      );
      if (
        new Set(capability.supportingWorkstreams).size !==
          capability.supportingWorkstreams.length ||
        capability.supportingWorkstreams.includes(
          capability.primaryWorkstream,
        )
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Supporting workstreams must be unique and exclude the Primary Workstream.",
          path: ["sharedCapabilities", index, "supportingWorkstreams"],
        });
      }
      const linkedCodes = capability.linkedPhases.map(({ code }) => code);
      if (
        new Set(linkedCodes).size !== linkedCodes.length ||
        linkedCodes.some((code) => !knownPhases.has(code))
      ) {
        context.addIssue({
          code: "custom",
          message: `${capability.code} contains duplicate or unknown phase links.`,
          path: ["sharedCapabilities", index, "linkedPhases"],
        });
      }
    }

    validateDateRange(
      document.project.startDate,
      document.project.targetDate,
      context,
      ["project", "targetDate"],
    );
  });

type OwnerValue = z.infer<typeof ownerSchema>;

function validateDateRange(
  start: string | null,
  end: string | null,
  context: z.RefinementCtx,
  pathValue: PropertyKey[],
) {
  if (start && end && start > end) {
    context.addIssue({
      code: "custom",
      message: "End date must be on or after the start date.",
      path: pathValue,
    });
  }
}

function databaseDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function ownerEmail(value: OwnerValue) {
  if (!value) return null;
  if (typeof value === "object") return value.email.toLowerCase();
  return value.includes("@") ? value.toLowerCase() : null;
}

function ownerLabel(value: OwnerValue) {
  if (!value || typeof value !== "string" || value.includes("@")) return null;
  return value;
}

async function main() {
  const sourceArgument = process.argv[2];
  const shouldApply = process.argv.includes("--apply");
  const scope: RoadmapImportScope = process.argv.includes("--technical-only")
    ? "technical-only"
    : process.argv.includes("--business-only")
      ? "business-only"
      : "full";
  if (
    process.argv.includes("--technical-only") &&
    process.argv.includes("--business-only")
  ) {
    throw new Error("Choose only one scoped import option.");
  }
  if (!sourceArgument || sourceArgument.startsWith("--")) {
    throw new Error(
      "Usage: npx tsx scripts/import-pms-roadmap-json.ts <file> [--apply] [--technical-only|--business-only]",
    );
  }

  const sourcePath = path.normalize(sourceArgument);
  const rawDocument = JSON.parse(await readFile(sourcePath, "utf8")) as unknown;
  const document = roadmapSchema.parse(rawDocument);
  const phasesToImport = phasesForImport(document.phases, scope);
  const env = parseServerEnv(process.env);
  const database = createPrismaClient(env.DATABASE_URL);
  const unresolvedOwnerLabels = new Set<string>();

  try {
    const project = await database.project.findUnique({
      where: { code: "PMS" },
      select: {
        id: true,
        milestones: {
          where: { archivedAt: null },
          select: {
            id: true,
            code: true,
            workItems: {
              where: { archivedAt: null },
              select: { id: true, code: true },
            },
          },
        },
        sharedCapabilities: {
          where: { archivedAt: null },
          select: { code: true },
        },
        members: {
          where: {
            archivedAt: null,
            user: { isActive: true, archivedAt: null },
          },
          select: {
            userId: true,
            user: { select: { normalizedEmail: true } },
          },
        },
      },
    });
    if (!project) throw new Error("PMS Dashboard project was not found.");

    const userIdsByEmail = new Map(
      project.members.map(({ userId, user }) => [
        user.normalizedEmail,
        userId,
      ]),
    );
    for (const phase of phasesToImport) {
      for (const item of phase.workItems) {
        const label = ownerLabel(item.owner);
        if (label) unresolvedOwnerLabels.add(label);
        const email = ownerEmail(item.owner);
        if (email && !userIdsByEmail.has(email)) {
          throw new Error(
            `Owner ${email} is not an active PMS project member.`,
          );
        }
      }
    }
    if (scope === "full") {
      for (const capability of document.sharedCapabilities) {
        const label = ownerLabel(capability.owner);
        if (label) unresolvedOwnerLabels.add(label);
        const email = ownerEmail(capability.owner);
        if (email && !userIdsByEmail.has(email)) {
          throw new Error(
            `Owner ${email} is not an active PMS project member.`,
          );
        }
      }
    }

    const beforeCounts = storedCountsForImport(project, scope);
    const afterCounts = documentCountsForImport(document, scope);

    if (!shouldApply) {
      console.info(
        JSON.stringify(
          {
            mode: "validation-only",
            scope,
            sourceFile: path.basename(sourcePath),
            beforeCounts,
            afterCounts,
            unresolvedOwnerLabels: [...unresolvedOwnerLabels].sort(),
          },
          null,
          2,
        ),
      );
      return;
    }

    await database.$transaction(
      async (transaction) => {
        const workstreams = await transaction.workstream.findMany({
          where: {
            code: { in: ["FRONTEND", "BACKEND", "DATABASE"] },
            archivedAt: null,
          },
          select: { id: true, code: true },
        });
        const workstreamIds = new Map(
          workstreams.map(({ id, code }) => [code, id]),
        );
        if (workstreamIds.size !== 3) {
          throw new Error("One or more canonical Workstreams are unavailable.");
        }

        if (scope === "full") {
          await transaction.project.update({
            where: { id: project.id },
            data: {
              name: document.project.name,
              description: document.project.description,
              status: document.project.status,
              progress: document.project.progress,
              startDate: databaseDate(document.project.startDate),
              targetDate: databaseDate(document.project.targetDate),
            },
          });
        }

        const milestoneIds = new Map<string, string>();
        for (const phase of phasesToImport) {
          const stored = await transaction.milestone.upsert({
            where: {
              projectId_code: {
                projectId: project.id,
                code: phase.code,
              },
            },
            create: {
              projectId: project.id,
              code: phase.code,
              name: phase.name,
              businessPurpose: phase.businessPurpose,
              status: phase.status,
              progress: phase.progress,
              riskLevel: phase.riskLevel,
              deliveryStage: phase.deliveryStage,
              releaseHorizon: phase.releaseHorizon,
              sortOrder: phase.sortOrder,
              startDate: databaseDate(phase.startDate),
              dueDate: databaseDate(phase.dueDate),
              deliveredScope: phase.deliveredScope,
              remainingScope: phase.remainingScope,
              currentBlockers: phase.currentBlockers,
              nextAction: phase.nextAction,
              firstReleaseImpact: phase.firstReleaseImpact,
            },
            update: {
              name: phase.name,
              businessPurpose: phase.businessPurpose,
              status: phase.status,
              progress: phase.progress,
              riskLevel: phase.riskLevel,
              deliveryStage: phase.deliveryStage,
              releaseHorizon: phase.releaseHorizon,
              sortOrder: phase.sortOrder,
              startDate: databaseDate(phase.startDate),
              dueDate: databaseDate(phase.dueDate),
              deliveredScope: phase.deliveredScope,
              remainingScope: phase.remainingScope,
              currentBlockers: phase.currentBlockers,
              nextAction: phase.nextAction,
              firstReleaseImpact: phase.firstReleaseImpact,
              archivedAt: null,
            },
            select: { id: true },
          });
          milestoneIds.set(phase.code, stored.id);
        }

        for (const phase of phasesToImport) {
          const milestoneId = milestoneIds.get(phase.code);
          if (!milestoneId) {
            throw new Error(`Milestone lookup failed for ${phase.code}.`);
          }
          for (const item of phase.workItems) {
            const primaryWorkstreamId = workstreamIds.get(
              item.primaryWorkstream,
            );
            if (!primaryWorkstreamId) {
              throw new Error(
                `Primary Workstream lookup failed for ${item.code}.`,
              );
            }
            const email = ownerEmail(item.owner);
            let existing = await transaction.workItem.findUnique({
              where: {
                milestoneId_code: { milestoneId, code: item.code },
              },
              select: { id: true, deliveryStage: true },
            });
            if (!existing && scope === "business-only") {
              const movable = await transaction.workItem.findFirst({
                where: {
                  code: item.code,
                  archivedAt: null,
                  milestone: {
                    projectId: project.id,
                    code: { startsWith: "BPH-" },
                  },
                },
                select: { id: true, deliveryStage: true },
              });
              if (movable) {
                existing = await transaction.workItem.update({
                  where: { id: movable.id },
                  data: { milestoneId },
                  select: { id: true, deliveryStage: true },
                });
              }
            }
            if (existing) {
              await transaction.workItemWorkstream.deleteMany({
                where: { workItemId: existing.id },
              });
            }
            const stored = await transaction.workItem.upsert({
              where: {
                milestoneId_code: { milestoneId, code: item.code },
              },
              create: {
                milestoneId,
                primaryWorkstreamId,
                ownerId: email ? userIdsByEmail.get(email) : null,
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
                startDate: databaseDate(item.startDate),
                dueDate: databaseDate(item.dueDate),
                plannedStartDate: databaseDate(item.plannedDates.start),
                plannedCheckDate: databaseDate(item.plannedDates.check),
                plannedProductionReadyDate: databaseDate(
                  item.plannedDates.productionReady,
                ),
                plannedGoLiveDate: databaseDate(item.plannedDates.goLive),
                actualStartDate: databaseDate(item.actualDates.start),
                actualCheckDate: databaseDate(item.actualDates.check),
                actualProductionReadyDate: databaseDate(
                  item.actualDates.productionReady,
                ),
                actualGoLiveDate: databaseDate(item.actualDates.goLive),
                nextGate: item.nextGate,
                nextAction: item.nextAction,
                blocker: item.blocker,
                blockerSummary: item.blockerSummary,
                implementationNotes: item.implementationNotes,
              },
              update: {
                primaryWorkstreamId,
                ownerId: email ? userIdsByEmail.get(email) : null,
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
                startDate: databaseDate(item.startDate),
                dueDate: databaseDate(item.dueDate),
                plannedStartDate: databaseDate(item.plannedDates.start),
                plannedCheckDate: databaseDate(item.plannedDates.check),
                plannedProductionReadyDate: databaseDate(
                  item.plannedDates.productionReady,
                ),
                plannedGoLiveDate: databaseDate(item.plannedDates.goLive),
                actualStartDate: databaseDate(item.actualDates.start),
                actualCheckDate: databaseDate(item.actualDates.check),
                actualProductionReadyDate: databaseDate(
                  item.actualDates.productionReady,
                ),
                actualGoLiveDate: databaseDate(item.actualDates.goLive),
                nextGate: item.nextGate,
                nextAction: item.nextAction,
                blocker: item.blocker,
                blockerSummary: item.blockerSummary,
                implementationNotes: item.implementationNotes,
                archivedAt: null,
              },
              select: { id: true, deliveryStage: true },
            });

            if (item.supportingWorkstreams.length) {
              await transaction.workItemWorkstream.createMany({
                data: item.supportingWorkstreams.map((code) => {
                  const workstreamId = workstreamIds.get(code);
                  if (!workstreamId) {
                    throw new Error(
                      `Supporting Workstream lookup failed for ${item.code}.`,
                    );
                  }
                  return { workItemId: stored.id, workstreamId };
                }),
              });
            }

            await transaction.workPackageCheckpoint.deleteMany({
              where: { workItemId: stored.id },
            });
            if (item.checkpoints.length) {
              await transaction.workPackageCheckpoint.createMany({
                data: item.checkpoints.map((checkpoint) => ({
                  workItemId: stored.id,
                  checkpointCode: checkpoint.code,
                  plannedDate: databaseDate(checkpoint.plannedDate),
                  actualDate: databaseDate(checkpoint.actualDate),
                  status: checkpoint.status,
                  note: checkpoint.note,
                })),
              });
            }

            if (
              !existing ||
              existing.deliveryStage !== stored.deliveryStage
            ) {
              await transaction.deliveryStageHistory.create({
                data: {
                  workItemId: stored.id,
                  fromStage: existing?.deliveryStage ?? null,
                  toStage: stored.deliveryStage,
                  notes: "Updated by PMS roadmap JSON import.",
                },
              });
            }
          }
        }

        if (scope !== "full") {
          const archivePlan =
            scope === "technical-only"
              ? buildTechnicalArchivePlan(project.milestones, phasesToImport)
              : buildBusinessArchivePlan(project.milestones, phasesToImport);
          if (archivePlan.workItemIds.length) {
            await transaction.workItem.updateMany({
              where: { id: { in: archivePlan.workItemIds }, archivedAt: null },
              data: { archivedAt: new Date() },
            });
          }
          if (archivePlan.milestoneIds.length) {
            await transaction.milestone.updateMany({
              where: { id: { in: archivePlan.milestoneIds }, archivedAt: null },
              data: { archivedAt: new Date() },
            });
          }
        } else {
          const includedItemCodes = document.phases.flatMap(({ workItems }) =>
            workItems.map(({ code }) => code),
          );
          await transaction.workItem.updateMany({
            where: {
              milestone: { projectId: project.id },
              archivedAt: null,
              code: { notIn: includedItemCodes },
            },
            data: { archivedAt: new Date() },
          });
          await transaction.milestone.updateMany({
            where: {
              projectId: project.id,
              archivedAt: null,
              code: {
                notIn: document.phases.map(({ code }) => code),
              },
            },
            data: { archivedAt: new Date() },
          });
        }

        if (scope === "full") {
          for (const capability of document.sharedCapabilities) {
            const primaryWorkstreamId = workstreamIds.get(
              capability.primaryWorkstream,
            );
            if (!primaryWorkstreamId) {
              throw new Error(
                `Capability Workstream lookup failed for ${capability.code}.`,
              );
            }
            const email = ownerEmail(capability.owner);
            const existing = await transaction.sharedCapability.findUnique({
              where: {
                projectId_code: {
                  projectId: project.id,
                  code: capability.code,
                },
              },
              select: { id: true, deliveryStage: true },
            });
            if (existing) {
              await transaction.sharedCapabilityWorkstream.deleteMany({
                where: { sharedCapabilityId: existing.id },
              });
            }
            const stored = await transaction.sharedCapability.upsert({
              where: {
                projectId_code: {
                  projectId: project.id,
                  code: capability.code,
                },
              },
              create: {
                projectId: project.id,
                primaryWorkstreamId,
                ownerId: email ? userIdsByEmail.get(email) : null,
                code: capability.code,
                name: capability.name,
                description: capability.description,
                acceptanceCriteria: capability.acceptanceCriteria,
                notes: capability.notes,
                status: capability.status,
                progress: capability.progress,
                riskLevel: capability.riskLevel,
                deliveryStage: capability.deliveryStage,
                startDate: databaseDate(capability.startDate),
                dueDate: databaseDate(capability.dueDate),
                nextGate: capability.nextGate,
                blocker: capability.blocker,
              },
              update: {
                primaryWorkstreamId,
                ownerId: email ? userIdsByEmail.get(email) : null,
                name: capability.name,
                description: capability.description,
                acceptanceCriteria: capability.acceptanceCriteria,
                notes: capability.notes,
                status: capability.status,
                progress: capability.progress,
                riskLevel: capability.riskLevel,
                deliveryStage: capability.deliveryStage,
                startDate: databaseDate(capability.startDate),
                dueDate: databaseDate(capability.dueDate),
                nextGate: capability.nextGate,
                blocker: capability.blocker,
                archivedAt: null,
              },
              select: { id: true, deliveryStage: true },
            });

            if (capability.supportingWorkstreams.length) {
              await transaction.sharedCapabilityWorkstream.createMany({
                data: capability.supportingWorkstreams.map((code) => {
                  const workstreamId = workstreamIds.get(code);
                  if (!workstreamId) {
                    throw new Error(
                      `Capability supporting Workstream lookup failed for ${capability.code}.`,
                    );
                  }
                  return { sharedCapabilityId: stored.id, workstreamId };
                }),
              });
            }

            await transaction.milestoneSharedCapability.deleteMany({
              where: {
                projectId: project.id,
                sharedCapabilityId: stored.id,
              },
            });
            if (capability.linkedPhases.length) {
              await transaction.milestoneSharedCapability.createMany({
                data: capability.linkedPhases.map((link) => {
                  const milestoneId = milestoneIds.get(link.code);
                  if (!milestoneId) {
                    throw new Error(
                      `Capability phase lookup failed for ${link.code}.`,
                    );
                  }
                  return {
                    projectId: project.id,
                    milestoneId,
                    sharedCapabilityId: stored.id,
                    sourceReference: link.sourceReference,
                    dependencyNotes: link.dependencyNotes,
                    isCritical: link.isCritical,
                  };
                }),
              });
            }

            if (
              !existing ||
              existing.deliveryStage !== stored.deliveryStage
            ) {
              await transaction.deliveryStageHistory.create({
                data: {
                  sharedCapabilityId: stored.id,
                  fromStage: existing?.deliveryStage ?? null,
                  toStage: stored.deliveryStage,
                  notes: "Updated by PMS roadmap JSON import.",
                },
              });
            }
          }

          await transaction.sharedCapability.updateMany({
            where: {
              projectId: project.id,
              archivedAt: null,
              ...(document.sharedCapabilities.length
                ? {
                    code: {
                      notIn: document.sharedCapabilities.map(({ code }) => code),
                    },
                  }
                : {}),
            },
            data: { archivedAt: new Date() },
          });
        }

        await transaction.auditLog.create({
          data: {
            projectId: project.id,
            action: "roadmap.json_imported",
            entityType: "Project",
            entityId: project.id,
            beforeState: beforeCounts,
            afterState: afterCounts,
            metadata: {
              sourceFile: path.basename(sourcePath),
              schemaVersion: document.schemaVersion,
              scope,
              unresolvedOwnerLabels: [...unresolvedOwnerLabels].sort(),
            },
          },
        });
      },
      { maxWait: 10_000, timeout: 120_000 },
    );

    console.info(
      JSON.stringify(
        {
          mode: "applied",
          scope,
          sourceFile: path.basename(sourcePath),
          beforeCounts,
          afterCounts,
          unresolvedOwnerLabels: [...unresolvedOwnerLabels].sort(),
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
  if (error instanceof z.ZodError) {
    console.error(
      JSON.stringify(
        error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        null,
        2,
      ),
    );
  } else {
    console.error(
      error instanceof Error ? error.message : "Roadmap JSON import failed.",
    );
  }
  process.exitCode = 1;
});
