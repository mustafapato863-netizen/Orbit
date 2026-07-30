import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const prismaDirectory = join(process.cwd(), "prisma");
const schema = readFileSync(join(prismaDirectory, "schema.prisma"), "utf8");
const migrationsDirectory = join(prismaDirectory, "migrations");
const migrationDirectory = readdirSync(migrationsDirectory, {
  withFileTypes: true,
}).find((entry) => entry.isDirectory());

if (!migrationDirectory) {
  throw new Error("The initial Prisma migration is missing.");
}

const migration = readFileSync(
  join(migrationsDirectory, migrationDirectory.name, "migration.sql"),
  "utf8",
);
const allMigrations = readdirSync(migrationsDirectory, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    readFileSync(
      join(migrationsDirectory, entry.name, "migration.sql"),
      "utf8",
    ),
  )
  .join("\n");

const requiredModels = [
  "User",
  "Role",
  "Permission",
  "UserRole",
  "Project",
  "ProjectMember",
  "Milestone",
  "WorkItem",
  "SharedCapability",
  "MilestoneSharedCapability",
  "Workstream",
  "WorkItemWorkstream",
  "DeliveryStageHistory",
  "Risk",
  "Decision",
  "Comment",
  "PilotScope",
  "PilotTeam",
  "PilotCriterion",
  "PilotIssue",
  "ReportSnapshot",
  "AuditLog",
] as const;

describe("Prisma domain schema", () => {
  it("contains every required Phase 2 model", () => {
    for (const model of requiredModels) {
      expect(schema).toMatch(new RegExp(`model\\s+${model}\\s+\\{`));
    }
  });

  it("uses relation tables instead of scalar ID arrays", () => {
    expect(schema).not.toMatch(/\w+Ids\s+String\[\]/);
    expect(schema).toContain("@@id([milestoneId, sharedCapabilityId])");
    expect(schema).toContain("@@id([workItemId, workstreamId])");
  });

  it("requires one primary workstream and models supporting workstreams separately", () => {
    expect(schema).toMatch(/primaryWorkstreamId\s+String\s+@db\.Uuid/);
    expect(schema).toContain("supportingWorkstreams WorkItemWorkstream[]");
    expect(migration).toContain("WorkItemWorkstream_not_primary_trigger");
  });

  it("contains an additive migration with database integrity checks", () => {
    expect(migration).toContain('CREATE TABLE "Project"');
    expect(migration).toContain("Project_progress_check");
    expect(migration).toContain("DeliveryStageHistory_target_check");
    expect(migration).not.toMatch(/\b(?:DROP TABLE|TRUNCATE TABLE)\b/i);
  });

  it("persists deterministic milestone ordering additively", () => {
    expect(schema).toMatch(/sortOrder\s+Int\s+@default\(0\)/);
    expect(schema).toContain("@@index([projectId, archivedAt, sortOrder])");
    expect(allMigrations).toContain(
      'ALTER TABLE "Milestone" ADD COLUMN     "sortOrder"',
    );
    expect(allMigrations).toContain("ROW_NUMBER() OVER");
    expect(allMigrations).not.toMatch(/\b(?:DROP TABLE|TRUNCATE TABLE)\b/i);
  });

  it("stores Shared Capability source references on relational links", () => {
    expect(schema).toMatch(
      /model MilestoneSharedCapability[\s\S]*sourceReference\s+String\?/,
    );
    expect(allMigrations).toContain(
      'ALTER TABLE "MilestoneSharedCapability" ADD COLUMN',
    );
    expect(allMigrations).not.toMatch(/\b(?:DROP TABLE|TRUNCATE TABLE)\b/i);
  });

  it("persists Pilot sign-off outcomes and normalized issues additively", () => {
    expect(schema).toContain("enum PilotSignOffStatus");
    expect(schema).toContain("enum PilotIssueStatus");
    expect(schema).toMatch(/model PilotIssue\s+\{/);
    expect(allMigrations).toContain('CREATE TABLE "PilotIssue"');
    expect(allMigrations).toContain('"businessSignOffStatus"');
    expect(allMigrations).not.toMatch(/\b(?:DROP TABLE|TRUNCATE TABLE)\b/i);
  });
});
