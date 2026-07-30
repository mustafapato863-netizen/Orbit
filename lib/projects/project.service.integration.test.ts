import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { createPrismaClient } from "@/lib/prisma-client";
import { ProjectService } from "@/lib/projects/project.service";

describe("Phase 4 project and milestone CRUD", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("creates, updates, orders, archives, audits, and rolls back the full workflow", async () => {
    const counts = async () => ({
      users: await database.user.count(),
      projects: await database.project.count(),
      memberships: await database.projectMember.count(),
      milestones: await database.milestone.count(),
      auditLogs: await database.auditLog.count(),
    });
    const before = await counts();
    const rollbackMarker = "ROLLBACK_PHASE4_CRUD";

    try {
      await database.$transaction(async (transaction) => {
        const marker = randomUUID();
        const actor = await transaction.user.create({
          data: {
            email: `phase4-manager-${marker}@orbit.local`,
            normalizedEmail: `phase4-manager-${marker}@orbit.local`,
            displayName: "Phase 4 Manager",
          },
        });
        const member = await transaction.user.create({
          data: {
            email: `phase4-viewer-${marker}@orbit.local`,
            normalizedEmail: `phase4-viewer-${marker}@orbit.local`,
            displayName: "Phase 4 Viewer",
          },
        });
        const service = new ProjectService(transaction);

        await expect(
          service.createProject(actor.id, {
            code: `PRIVATE-DENIED-${marker.slice(0, 8).toUpperCase()}`,
            name: "Private project denied",
            description: "",
            status: "PLANNING",
            progress: 0,
            isPrivate: true,
            startDate: "",
            targetDate: "",
          }),
        ).rejects.toMatchObject({
          code: "PRIVATE_VISIBILITY_REQUIRES_ADMIN",
        });

        const project = await service.createProject(actor.id, {
          code: `P4-${marker.slice(0, 8).toUpperCase()}`,
          name: "Phase 4 verification project",
          description: "Rollback-only integration verification.",
          status: "PLANNING",
          progress: 10,
          isPrivate: false,
          projectType: "SOFTWARE",
          setupTemplate: "SOFTWARE",
          startDate: "2026-08-01",
          targetDate: "2026-12-01",
        });
        expect(project.code).toMatch(/^PRJ-\d{3}$/);
        expect(
          await transaction.workstream.count({
            where: { projectId: project.id, archivedAt: null },
          }),
        ).toBe(5);
        expect(
          await transaction.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: project.id,
                userId: actor.id,
              },
            },
          }),
        ).toMatchObject({ role: "PROJECT_MANAGER", archivedAt: null });

        const updatedProject = await service.updateProject(actor.id, {
          projectId: project.id,
          code: project.code,
          name: "Updated Phase 4 project",
          description: "Updated.",
          status: "ACTIVE",
          progress: 25,
          isPrivate: false,
          startDate: "2026-08-01",
          targetDate: "2026-12-01",
        });
        expect(updatedProject).toMatchObject({
          status: "ACTIVE",
          progress: 25,
        });

        const first = await service.createMilestone(actor.id, {
          projectId: project.id,
          code: "M-01",
          name: "Release milestone",
          businessPurpose: "Deliver Release 1.",
          status: "IN_PROGRESS",
          progress: 40,
          riskLevel: "MEDIUM",
          releaseHorizon: "RELEASE_1",
          startDate: "2026-08-01",
          dueDate: "2026-09-01",
          deliveredScope: "Foundation",
          remainingScope: "Business rollout",
          currentBlockers: "",
          nextAction: "Review scope",
          firstReleaseImpact: "Required",
        });
        const second = await service.createMilestone(actor.id, {
          projectId: project.id,
          code: "M-02",
          name: "Phase 2 milestone",
          businessPurpose: "Deliver later scope.",
          status: "NOT_STARTED",
          progress: 0,
          riskLevel: "LOW",
          releaseHorizon: "PHASE_2",
          startDate: "",
          dueDate: "",
          deliveredScope: "",
          remainingScope: "Later scope",
          currentBlockers: "",
          nextAction: "",
          firstReleaseImpact: "Deferred",
        });
        expect(first.code).toBe("MS-001");
        expect(second.code).toBe("MS-002");

        expect(
          await service.reorderMilestone(actor.id, {
            projectId: project.id,
            milestoneId: second.id,
            direction: "UP",
          }),
        ).toEqual({ changed: true });
        const ordered = await transaction.milestone.findMany({
          where: { projectId: project.id, archivedAt: null },
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        });
        expect(ordered.map(({ id }) => id)).toEqual([second.id, first.id]);

        const editedMilestone = await service.updateMilestone(actor.id, {
          projectId: project.id,
          milestoneId: first.id,
          code: "M-01",
          name: "Release milestone updated",
          businessPurpose: "Deliver Release 1.",
          status: "COMPLETED",
          progress: 100,
          riskLevel: "LOW",
          releaseHorizon: "RELEASE_1",
          startDate: "2026-08-01",
          dueDate: "2026-09-01",
          deliveredScope: "Complete",
          remainingScope: "",
          currentBlockers: "",
          nextAction: "",
          firstReleaseImpact: "Delivered",
        });
        expect(editedMilestone).toMatchObject({
          status: "COMPLETED",
          progress: 100,
        });

        const builtPlan = await service.createMilestonePlan(actor.id, {
          projectId: project.id,
          name: "Concise milestone plan",
          subMilestones: [
            {
              name: "First delivery step",
              startDate: "2026-10-01",
              dueDate: "2026-10-03",
            },
            {
              name: "Second delivery step",
              startDate: "2026-10-04",
              dueDate: "2026-10-08",
            },
          ],
        });
        expect(
          await transaction.workItem.count({
            where: { milestoneId: builtPlan.id, archivedAt: null },
          }),
        ).toBe(2);
        expect(
          await transaction.milestone.findUnique({
            where: { id: builtPlan.id },
            select: { startDate: true, dueDate: true },
          }),
        ).toEqual({
          startDate: new Date("2026-10-01T00:00:00.000Z"),
          dueDate: new Date("2026-10-08T00:00:00.000Z"),
        });

        await expect(
          service.archiveMembership(actor.id, project.id, actor.id),
        ).rejects.toMatchObject({
          code: "LAST_PROJECT_MANAGER",
        });
        await service.setMembership(actor.id, {
          projectId: project.id,
          userId: member.id,
          role: "PROJECT_MANAGER",
        });
        await service.archiveMembership(actor.id, project.id, actor.id);

        await service.archiveMilestone(actor.id, project.id, first.id);
        expect(
          await transaction.milestone.findUnique({ where: { id: first.id } }),
        ).toMatchObject({ status: "ARCHIVED" });

        await service.archiveProject(member.id, project.id);
        expect(
          await transaction.project.findUnique({ where: { id: project.id } }),
        ).toMatchObject({ status: "ARCHIVED" });
        await expect(
          service.reorderMilestone(actor.id, {
            projectId: project.id,
            milestoneId: second.id,
            direction: "DOWN",
          }),
        ).rejects.toMatchObject({ code: "NOT_FOUND" });

        expect(
          await transaction.auditLog.count({
            where: { projectId: project.id },
          }),
        ).toBeGreaterThanOrEqual(9);

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
