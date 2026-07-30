import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { GovernanceService } from "@/lib/governance/governance.service";
import { createPrismaClient } from "@/lib/prisma-client";

describe("Phase 8 governance persistence", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });
  afterAll(async () => database.$disconnect());

  it("validates project relationships, writes history and rolls every change back", async () => {
    const counts = async () => ({
      users: await database.user.count(),
      projects: await database.project.count(),
      members: await database.projectMember.count(),
      milestones: await database.milestone.count(),
      workItems: await database.workItem.count(),
      risks: await database.risk.count(),
      decisions: await database.decision.count(),
      decisionWorkstreams: await database.decisionWorkstream.count(),
      comments: await database.comment.count(),
      audits: await database.auditLog.count(),
    });
    const before = await counts();
    const marker = "ROLLBACK_PHASE8_GOVERNANCE";

    try {
      await database.$transaction(async (transaction) => {
        const suffix = randomUUID();
        const actor = await transaction.user.create({
          data: {
            email: `phase8-${suffix}@orbit.local`,
            normalizedEmail: `phase8-${suffix}@orbit.local`,
            displayName: "Phase 8 Manager",
          },
        });
        const project = await transaction.project.create({
          data: {
            code: `P8-${suffix.slice(0, 8).toUpperCase()}`,
            slug: `phase8-${suffix}`,
            name: "Phase 8 verification",
          },
        });
        await transaction.projectMember.create({
          data: { projectId: project.id, userId: actor.id, role: "PROJECT_MANAGER" },
        });
        const milestone = await transaction.milestone.create({
          data: { projectId: project.id, code: "M-01", name: "Governance milestone" },
        });
        const [frontend, backend] = await Promise.all([
          transaction.workstream.create({
            data: {
              projectId: project.id,
              code: "FRONTEND",
              slug: "frontend",
              name: "Frontend",
              colorToken: "#2f73e8",
            },
          }),
          transaction.workstream.create({
            data: {
              projectId: project.id,
              code: "BACKEND",
              slug: "backend",
              name: "Backend",
              colorToken: "#129b68",
            },
          }),
        ]);
        const item = await transaction.workItem.create({
          data: {
            milestoneId: milestone.id,
            primaryWorkstreamId: frontend.id,
            code: "WI-01",
            name: "Governed delivery",
          },
        });
        const service = new GovernanceService(transaction);
        const risk = await service.createRisk(actor.id, {
          projectId: project.id,
          title: "Verification evidence delayed",
          description: "Approval depends on evidence.",
          probability: 4,
          impact: 5,
          milestoneId: milestone.id,
          targetType: "WORK_ITEM",
          targetId: item.id,
          primaryWorkstreamId: frontend.id,
          ownerId: actor.id,
          mitigation: "Complete the evidence review.",
          dueDate: "2026-09-01",
          status: "MITIGATING",
        });
        expect(risk.severity).toBe("CRITICAL");

        const decision = await service.createDecision(actor.id, {
          projectId: project.id,
          title: "Approve pilot entry",
          description: "Management must confirm the entry gate.",
          milestoneId: milestone.id,
          affectedWorkstreamIds: [frontend.id, backend.id],
          requiredBy: "2026-09-05",
          recommendedDirection: "Approve after evidence review.",
          ownerId: actor.id,
          status: "PENDING",
          decisionText: "",
        });
        await expect(
          service.updateDecision(actor.id, {
            projectId: project.id,
            decisionId: decision.id,
            title: decision.title,
            description: decision.description,
            milestoneId: milestone.id,
            affectedWorkstreamIds: [frontend.id],
            requiredBy: "2026-09-05",
            recommendedDirection: "Approve after evidence review.",
            ownerId: actor.id,
            status: "APPROVED",
            decisionText: "Manager attempted approval.",
          }),
        ).rejects.toMatchObject({ code: "REVIEW_REQUIRED" });
        await service.reviewDecision(actor.id, {
          projectId: project.id,
          decisionId: decision.id,
          status: "APPROVED",
          decisionText: "Approved with monitored rollout.",
          comment: "Evidence accepted.",
        });
        await service.addDecisionComment(actor.id, {
          projectId: project.id,
          decisionId: decision.id,
          body: "Pilot owner notified.",
        });

        expect(
          await transaction.decisionWorkstream.count({
            where: { decisionId: decision.id },
          }),
        ).toBe(2);
        expect(
          await transaction.comment.count({ where: { decisionId: decision.id } }),
        ).toBe(2);
        expect(
          await transaction.auditLog.count({
            where: { projectId: project.id, entityType: { in: ["Risk", "Decision"] } },
          }),
        ).toBe(4);

        const foreignProject = await transaction.project.create({
          data: {
            code: `OTHER-${suffix.slice(0, 6).toUpperCase()}`,
            slug: `other-${suffix}`,
            name: "Other project",
          },
        });
        const foreignMilestone = await transaction.milestone.create({
          data: { projectId: foreignProject.id, code: "M-X", name: "Foreign" },
        });
        await expect(
          service.updateRisk(actor.id, {
            projectId: project.id,
            riskId: risk.id,
            title: risk.title,
            description: risk.description,
            probability: 2,
            impact: 2,
            milestoneId: foreignMilestone.id,
            targetType: "NONE",
            targetId: "",
            primaryWorkstreamId: "",
            ownerId: actor.id,
            mitigation: "",
            dueDate: "",
            status: "OPEN",
          }),
        ).rejects.toMatchObject({ code: "INVALID_MILESTONE" });

        throw new Error(marker);
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== marker) throw error;
    }
    expect(await counts()).toEqual(before);
  });
});
