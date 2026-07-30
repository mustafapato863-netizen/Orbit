import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { recordAuditEntry } from "@/lib/audit/audit.service";
import { parseServerEnv } from "@/lib/env-schema";
import { createPrismaClient } from "@/lib/prisma-client";
import { ReportRepository } from "@/lib/reports/report.repository";

describe("Phase 10 report snapshot persistence", () => {
  let database: PrismaClient;

  beforeAll(() => {
    database = createPrismaClient(parseServerEnv(process.env).DATABASE_URL);
  });
  afterAll(async () => database.$disconnect());

  it("versions a snapshot, audits generation, and restores all counts after rollback", async () => {
    const counts = async () => ({
      users: await database.user.count(),
      projects: await database.project.count(),
      snapshots: await database.reportSnapshot.count(),
      audits: await database.auditLog.count(),
    });
    const before = await counts();
    const rollback = "ROLLBACK_PHASE10_REPORT";

    try {
      await database.$transaction(async (transaction) => {
        const suffix = randomUUID();
        const actor = await transaction.user.create({
          data: {
            email: `phase10-${suffix}@orbit.local`,
            normalizedEmail: `phase10-${suffix}@orbit.local`,
            displayName: "Phase 10 Reporter",
          },
        });
        const project = await transaction.project.create({
          data: {
            code: `P10-${suffix.slice(0, 8).toUpperCase()}`,
            slug: `phase10-${suffix}`,
            name: "Phase 10 report verification",
          },
        });
        const repository = new ReportRepository(transaction);
        const first = await repository.createSnapshot({
          projectId: project.id,
          generatedById: actor.id,
          reportType: "MANAGEMENT_EXCEL",
          title: "Management Review Pack",
          parameters: { format: "EXCEL", checksum: "safe-checksum" },
          snapshot: { schemaVersion: 1, canonicalPackageCount: 0 },
        });
        const second = await repository.createSnapshot({
          projectId: project.id,
          generatedById: actor.id,
          reportType: "MANAGEMENT_EXCEL",
          title: "Management Review Pack",
          parameters: { format: "EXCEL", checksum: "safe-checksum-2" },
          snapshot: { schemaVersion: 1, canonicalPackageCount: 0 },
        });
        await recordAuditEntry(transaction, {
          actorId: actor.id,
          projectId: project.id,
          action: "report.generated",
          entityType: "ReportSnapshot",
          entityId: second.id,
          afterState: { reportType: "MANAGEMENT_EXCEL", version: second.version },
        });

        expect(first.version).toBe(1);
        expect(second.version).toBe(2);
        expect(await transaction.auditLog.count({ where: { projectId: project.id, action: "report.generated" } })).toBe(1);
        throw new Error(rollback);
      });
    } catch (error) {
      if (!(error instanceof Error) || error.message !== rollback) throw error;
    }

    expect(await counts()).toEqual(before);
  });
});
