import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { parseServerEnv } from "@/lib/env-schema";
import { PilotService } from "@/lib/pilot/pilot.service";
import { createPrismaClient } from "@/lib/prisma-client";

describe("Phase 9 Controlled Pilot persistence", () => {
  let database: PrismaClient;
  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });
  afterAll(async () => database.$disconnect());

  it("persists scope, gates, issues and audited reviews atomically, then restores every count", async () => {
    const counts = async () => ({
      users: await database.user.count(),
      projects: await database.project.count(),
      members: await database.projectMember.count(),
      capabilities: await database.sharedCapability.count(),
      scopes: await database.pilotScope.count(),
      teams: await database.pilotTeam.count(),
      teamMembers: await database.pilotTeamMember.count(),
      pilotCapabilities: await database.pilotScopeCapability.count(),
      criteria: await database.pilotCriterion.count(),
      issues: await database.pilotIssue.count(),
      audits: await database.auditLog.count(),
    });
    const before = await counts();
    const rollbackMarker = "ROLLBACK_PHASE9_PILOT";

    try {
      await database.$transaction(async (transaction) => {
        const suffix = randomUUID();
        const actor = await transaction.user.create({
          data: {
            email: `phase9-${suffix}@orbit.local`,
            normalizedEmail: `phase9-${suffix}@orbit.local`,
            displayName: "Phase 9 Reviewer",
          },
        });
        const outsider = await transaction.user.create({
          data: {
            email: `phase9-outsider-${suffix}@orbit.local`,
            normalizedEmail: `phase9-outsider-${suffix}@orbit.local`,
            displayName: "Outsider",
          },
        });
        const project = await transaction.project.create({
          data: {
            code: `P9-${suffix.slice(0, 8).toUpperCase()}`,
            slug: `phase9-${suffix}`,
            name: "Phase 9 verification",
          },
        });
        await transaction.projectMember.create({
          data: { projectId: project.id, userId: actor.id, role: "PROJECT_MANAGER" },
        });
        const backend = await transaction.workstream.create({
          data: {
            projectId: project.id,
            code: "BACKEND",
            slug: "backend",
            name: "Backend",
            colorToken: "#129b68",
          },
        });
        const capability = await transaction.sharedCapability.create({
          data: {
            projectId: project.id,
            primaryWorkstreamId: backend.id,
            code: "SC-PILOT",
            name: `Pilot capability ${suffix}`,
          },
        });
        const service = new PilotService(transaction);
        const scope = await service.saveScope(actor.id, {
          projectId: project.id,
          name: "Controlled Pilot",
          knownLimitations: "Representative test limitation.",
          supportOwnerId: actor.id,
          rollbackOwnerId: actor.id,
        });
        const team = await service.createTeam(actor.id, {
          projectId: project.id,
          name: "Inbound",
          description: "Pilot team",
          leadUserId: actor.id,
          memberIds: [actor.id],
        });
        expect(
          await transaction.pilotTeamMember.count({
            where: { pilotTeamId: team.id },
          }),
        ).toBe(1);
        await expect(
          service.updateTeam(actor.id, {
            projectId: project.id,
            teamId: team.id,
            name: "Inbound",
            description: "",
            leadUserId: outsider.id,
            memberIds: [actor.id],
          }),
        ).rejects.toMatchObject({ code: "INVALID_MEMBER" });

        await service.setCapability(actor.id, {
          projectId: project.id,
          sharedCapabilityId: capability.id,
          disposition: "INCLUDED",
          notes: "Required for Pilot.",
        });
        const entry = await service.createCriterion(actor.id, {
          projectId: project.id,
          code: "ENTRY-01",
          type: "ENTRY",
          title: "Entry evidence ready",
          description: "",
          isRequired: true,
        });
        const exit = await service.createCriterion(actor.id, {
          projectId: project.id,
          code: "EXIT-01",
          type: "EXIT",
          title: "Exit evidence ready",
          description: "",
          isRequired: true,
        });
        await service.reviewCriterion(actor.id, {
          projectId: project.id,
          criterionId: entry.id,
          status: "MET",
          evidence: "Entry evidence accepted.",
        });
        await service.reviewCriterion(actor.id, {
          projectId: project.id,
          criterionId: exit.id,
          status: "MET",
          evidence: "Exit evidence accepted.",
        });
        const issue = await service.createIssue(actor.id, {
          projectId: project.id,
          title: "Support roster incomplete",
          description: "",
          severity: "HIGH",
          status: "OPEN",
          isBlocking: true,
          ownerId: actor.id,
          mitigation: "Confirm cover.",
          dueDate: "2026-09-01",
        });
        await service.reviewSignOff(actor.id, {
          projectId: project.id,
          signOff: "BUSINESS",
          outcome: "APPROVED",
          notes: "Business evidence accepted.",
        });
        await service.reviewSignOff(actor.id, {
          projectId: project.id,
          signOff: "TECHNICAL",
          outcome: "REJECTED",
          notes: "Rollback evidence incomplete.",
        });
        await service.reviewSignOff(actor.id, {
          projectId: project.id,
          signOff: "TECHNICAL",
          outcome: "APPROVED",
          notes: "Rollback evidence completed.",
        });
        await expect(
          service.reviewFinalDecision(actor.id, {
            projectId: project.id,
            status: "APPROVED",
            finalDecision: "Approve.",
          }),
        ).rejects.toMatchObject({ code: "NOT_READY" });
        await service.updateIssue(actor.id, {
          projectId: project.id,
          issueId: issue.id,
          title: issue.title,
          description: "",
          severity: "HIGH",
          status: "RESOLVED",
          isBlocking: true,
          ownerId: actor.id,
          mitigation: "Coverage confirmed.",
          dueDate: "2026-09-01",
        });
        await service.reviewFinalDecision(actor.id, {
          projectId: project.id,
          status: "APPROVED",
          finalDecision: "Pilot approved for the agreed scope.",
        });

        expect(
          await transaction.pilotScope.findUnique({ where: { id: scope.id } }),
        ).toMatchObject({
          businessSignOffStatus: "APPROVED",
          technicalSignOffStatus: "APPROVED",
          finalDecisionStatus: "APPROVED",
        });
        expect(
          await transaction.auditLog.count({
            where: {
              projectId: project.id,
              action: {
                in: [
                  "pilot.criterion_reviewed",
                  "pilot.business_sign_off_reviewed",
                  "pilot.technical_sign_off_reviewed",
                  "pilot.final_decision_reviewed",
                ],
              },
            },
          }),
        ).toBe(6);
        throw new Error(rollbackMarker);
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== rollbackMarker) throw error;
    }
    expect(await counts()).toEqual(before);
  });
});
