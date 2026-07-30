import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { ExecutionService } from "@/lib/execution/execution.service";
import { createPrismaClient } from "@/lib/prisma-client";

describe("Phase 5 technical execution persistence", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("persists canonical execution relationships, enforces ownership, audits, and rolls back", async () => {
    const counts = async () => ({
      users: await database.user.count(),
      projects: await database.project.count(),
      memberships: await database.projectMember.count(),
      milestones: await database.milestone.count(),
      workItems: await database.workItem.count(),
      workItemWorkstreams: await database.workItemWorkstream.count(),
      capabilities: await database.sharedCapability.count(),
      capabilityWorkstreams:
        await database.sharedCapabilityWorkstream.count(),
      capabilityLinks: await database.milestoneSharedCapability.count(),
      stageHistory: await database.deliveryStageHistory.count(),
      auditLogs: await database.auditLog.count(),
    });
    const before = await counts();
    const rollbackMarker = "ROLLBACK_PHASE5_EXECUTION";

    try {
      await database.$transaction(async (transaction) => {
        const marker = randomUUID();
        const actor = await transaction.user.create({
          data: {
            email: `phase5-lead-${marker}@orbit.local`,
            normalizedEmail: `phase5-lead-${marker}@orbit.local`,
            displayName: "Phase 5 Technical Lead",
          },
        });
        const other = await transaction.user.create({
          data: {
            email: `phase5-other-${marker}@orbit.local`,
            normalizedEmail: `phase5-other-${marker}@orbit.local`,
            displayName: "Unassigned Lead",
          },
        });
        const project = await transaction.project.create({
          data: {
            code: `P5-${marker.slice(0, 8).toUpperCase()}`,
            slug: `phase5-${marker}`,
            name: "Phase 5 verification project",
          },
        });
        await transaction.projectMember.createMany({
          data: [
            {
              projectId: project.id,
              userId: actor.id,
              role: "TECHNICAL_LEAD",
            },
            {
              projectId: project.id,
              userId: other.id,
              role: "TECHNICAL_LEAD",
            },
          ],
        });
        const firstMilestone = await transaction.milestone.create({
          data: {
            projectId: project.id,
            code: "M-01",
            name: "First Business Milestone",
          },
        });
        const secondMilestone = await transaction.milestone.create({
          data: {
            projectId: project.id,
            code: "M-02",
            name: "Second Business Milestone",
            sortOrder: 10,
          },
        });
        await transaction.workstream.createMany({
          data: [
            { projectId: project.id, code: "FRONTEND", slug: "frontend", name: "Frontend", colorToken: "#2f73e8", sortOrder: 10 },
            { projectId: project.id, code: "BACKEND", slug: "backend", name: "Backend", colorToken: "#129b68", sortOrder: 20 },
            { projectId: project.id, code: "DATABASE", slug: "database", name: "Database", colorToken: "#e8860b", sortOrder: 30 },
          ],
        });
        const workstreams = await transaction.workstream.findMany({
          where: { projectId: project.id, archivedAt: null },
          select: { id: true, code: true },
        });
        const byCode = new Map(
          workstreams.map(({ id, code }) => [code, id] as const),
        );
        const frontendId = byCode.get("FRONTEND");
        const backendId = byCode.get("BACKEND");
        const databaseId = byCode.get("DATABASE");
        if (!frontendId || !backendId || !databaseId) {
          throw new Error("Canonical Workstreams are not seeded.");
        }
        const service = new ExecutionService(transaction);

        const workItem = await service.createWorkItem(actor.id, {
          projectId: project.id,
          milestoneId: firstMilestone.id,
          code: "WI-01",
          name: "Employee workspace delivery",
          description: "Milestone-specific implementation.",
          primaryWorkstreamId: frontendId,
          supportingWorkstreamIds: [backendId],
          status: "IN_PROGRESS",
          progress: 30,
          deliveryStage: "IN_DEVELOPMENT",
          nextGate: "Technical verification",
          startDate: "2026-08-01",
          dueDate: "2026-09-01",
          ownerId: actor.id,
          riskLevel: "MEDIUM",
          blocker: "",
          notes: "Initial delivery.",
          acceptanceCriteria: "Responsive and authorized.",
        });
        expect(workItem.code).toBe(`${firstMilestone.code}.1`);
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          dueDate: new Date("2026-09-01T00:00:00.000Z"),
        });
        expect(
          await transaction.workItemWorkstream.findMany({
            where: { workItemId: workItem.id },
          }),
        ).toHaveLength(1);

        const secondWorkItem = await service.createWorkItem(actor.id, {
          projectId: project.id,
          milestoneId: firstMilestone.id,
          code: "WI-02",
          name: "Reporting alignment",
          description: "Another milestone-specific item.",
          primaryWorkstreamId: backendId,
          supportingWorkstreamIds: [frontendId],
          status: "IN_PROGRESS",
          progress: 55,
          deliveryStage: "IN_DEVELOPMENT",
          nextGate: "Technical verification",
          startDate: "2026-07-20",
          dueDate: "2026-09-14",
          ownerId: actor.id,
          riskLevel: "MEDIUM",
          blocker: "",
          notes: "Secondary delivery.",
          acceptanceCriteria: "Aligned reporting.",
        });
        expect(secondWorkItem.code).toBe(`${firstMilestone.code}.2`);
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-07-20T00:00:00.000Z"),
          dueDate: new Date("2026-09-14T00:00:00.000Z"),
        });

        await service.updateWorkItem(actor.id, {
          projectId: project.id,
          // A stale page can retain the former group after an administrative
          // roadmap regrouping. The immutable Work Item ID remains canonical.
          milestoneId: secondMilestone.id,
          workItemId: workItem.id,
          code: workItem.code,
          name: workItem.name,
          description: "Updated implementation.",
          primaryWorkstreamId: frontendId,
          supportingWorkstreamIds: [databaseId],
          status: "IN_PROGRESS",
          progress: 60,
          deliveryStage: "TECHNICAL_VERIFICATION",
          nextGate: "Business UAT",
          startDate: "2026-08-01",
          dueDate: "2026-09-01",
          ownerId: actor.id,
          riskLevel: "LOW",
          blocker: "",
          notes: "Verification evidence attached.",
          acceptanceCriteria: "Responsive and authorized.",
        });
        await expect(
          service.updateAssignedWorkItem(other.id, {
            workItemId: workItem.id,
            status: "IN_PROGRESS",
            progress: 65,
            deliveryStage: "TECHNICAL_VERIFICATION",
            nextGate: "Business UAT",
            riskLevel: "LOW",
            blocker: "",
            notes: "",
          }),
        ).rejects.toMatchObject({ code: "NOT_ASSIGNED" });
        await service.updateAssignedWorkItem(actor.id, {
          workItemId: workItem.id,
          status: "IN_PROGRESS",
          progress: 75,
          deliveryStage: "BUSINESS_UAT",
          nextGate: "UAT approval",
          riskLevel: "LOW",
          blocker: "",
          notes: "Ready for review.",
        });
        expect(
          await transaction.deliveryStageHistory.count({
            where: { workItemId: workItem.id },
          }),
        ).toBe(3);

        await service.archiveWorkItem(
          actor.id,
          project.id,
          firstMilestone.id,
          secondWorkItem.id,
        );
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          dueDate: new Date("2026-09-01T00:00:00.000Z"),
        });

        const capability = await service.createCapability(actor.id, {
          projectId: project.id,
          code: "SC-AUTH",
          name: "Authentication & Session Security",
          description: "One canonical authentication capability.",
          primaryWorkstreamId: backendId,
          supportingWorkstreamIds: [frontendId, databaseId],
          status: "IN_PROGRESS",
          progress: 50,
          deliveryStage: "IN_DEVELOPMENT",
          nextGate: "Security verification",
          startDate: "2026-08-01",
          dueDate: "2026-09-15",
          ownerId: actor.id,
          riskLevel: "HIGH",
          blocker: "Session review pending.",
          notes: "Canonical implementation only.",
          acceptanceCriteria: "Both milestones consume one verified record.",
          milestoneLinks: [
            {
              milestoneId: firstMilestone.id,
              sourceReference: "M-01 access dependency",
              dependencyNotes: "Protects employee access.",
              isCritical: true,
            },
            {
              milestoneId: secondMilestone.id,
              sourceReference: "M-02 access dependency",
              dependencyNotes: "Protects management access.",
              isCritical: true,
            },
          ],
        });
        expect(capability.code).toBe("CAP-001");
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          dueDate: new Date("2026-09-15T00:00:00.000Z"),
        });
        expect(
          await transaction.milestone.findUnique({
            where: { id: secondMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          dueDate: new Date("2026-09-15T00:00:00.000Z"),
        });
        expect(
          await transaction.sharedCapability.count({
            where: { projectId: project.id },
          }),
        ).toBe(1);
        expect(
          await transaction.milestoneSharedCapability.findMany({
            where: { sharedCapabilityId: capability.id },
            orderBy: { sourceReference: "asc" },
          }),
        ).toMatchObject([
          { sourceReference: "M-01 access dependency" },
          { sourceReference: "M-02 access dependency" },
        ]);

        await service.updateCapability(actor.id, {
          projectId: project.id,
          sharedCapabilityId: capability.id,
          code: capability.code,
          name: capability.name,
          description: "Updated canonical authentication capability.",
          primaryWorkstreamId: backendId,
          supportingWorkstreamIds: [databaseId],
          status: "IN_PROGRESS",
          progress: 70,
          deliveryStage: "TECHNICAL_VERIFICATION",
          nextGate: "Business UAT",
          startDate: "2026-08-01",
          dueDate: "2026-09-15",
          ownerId: actor.id,
          riskLevel: "MEDIUM",
          blocker: "",
          notes: "Canonical verification.",
          acceptanceCriteria: "Both milestones consume one verified record.",
          milestoneLinks: [
            {
              milestoneId: firstMilestone.id,
              sourceReference: "M-01 canonical access dependency",
              dependencyNotes: "Protects employee access.",
              isCritical: true,
            },
            {
              milestoneId: secondMilestone.id,
              sourceReference: "M-02 canonical access dependency",
              dependencyNotes: "Protects management access.",
              isCritical: true,
            },
          ],
        });
        await expect(
          service.updateAssignedCapability(other.id, {
            sharedCapabilityId: capability.id,
            status: "IN_PROGRESS",
            progress: 75,
            deliveryStage: "TECHNICAL_VERIFICATION",
            nextGate: "Business UAT",
            riskLevel: "LOW",
            blocker: "",
            notes: "",
          }),
        ).rejects.toMatchObject({ code: "NOT_ASSIGNED" });
        await service.updateAssignedCapability(actor.id, {
          sharedCapabilityId: capability.id,
          status: "IN_PROGRESS",
          progress: 80,
          deliveryStage: "BUSINESS_UAT",
          nextGate: "Security approval",
          riskLevel: "LOW",
          blocker: "",
          notes: "Ready for review.",
        });
        expect(
          await transaction.deliveryStageHistory.count({
            where: { sharedCapabilityId: capability.id },
          }),
        ).toBe(3);

        await service.archiveWorkItem(
          actor.id,
          project.id,
          firstMilestone.id,
          workItem.id,
        );
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: new Date("2026-08-01T00:00:00.000Z"),
          dueDate: new Date("2026-09-15T00:00:00.000Z"),
        });
        await service.archiveCapability(actor.id, project.id, capability.id);
        expect(
          await transaction.milestone.findUnique({
            where: { id: firstMilestone.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toMatchObject({
          startDate: null,
          dueDate: null,
        });
        expect(
          await transaction.workItem.findUnique({ where: { id: workItem.id } }),
        ).toMatchObject({ status: "ARCHIVED" });
        expect(
          await transaction.sharedCapability.findUnique({
            where: { id: capability.id },
          }),
        ).toMatchObject({ status: "ARCHIVED" });
        expect(
          await transaction.auditLog.count({
            where: { projectId: project.id },
          }),
        ).toBe(10);

        throw new Error(rollbackMarker);
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== rollbackMarker) {
        throw error;
      }
    }

    expect(await counts()).toEqual(before);
  });
});
