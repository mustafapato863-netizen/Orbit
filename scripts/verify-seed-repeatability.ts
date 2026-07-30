import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";
import { seedReferenceData } from "../prisma/seed";

async function captureSeededCounts(
  database: ReturnType<typeof createPrismaClient>,
) {
  const [
    users,
    roles,
    permissions,
    userRoles,
    rolePermissions,
    projects,
    projectMembers,
    milestones,
    workItems,
    sharedCapabilities,
    milestoneSharedCapabilities,
    risks,
    decisions,
    pilotTeams,
    pilotCriteria,
    pilotIssues,
  ] = await Promise.all([
    database.user.count(),
    database.role.count(),
    database.permission.count(),
    database.userRole.count(),
    database.rolePermission.count(),
    database.project.count(),
    database.projectMember.count(),
    database.milestone.count(),
    database.workItem.count(),
    database.sharedCapability.count(),
    database.milestoneSharedCapability.count(),
    database.risk.count(),
    database.decision.count(),
    database.pilotTeam.count(),
    database.pilotCriterion.count(),
    database.pilotIssue.count(),
  ]);

  return {
    users,
    roles,
    permissions,
    userRoles,
    rolePermissions,
    projects,
    projectMembers,
    milestones,
    workItems,
    sharedCapabilities,
    milestoneSharedCapabilities,
    risks,
    decisions,
    pilotTeams,
    pilotCriteria,
    pilotIssues,
  };
}

async function main() {
  const env = parseServerEnv(process.env);
  const database = createPrismaClient(env.DATABASE_URL);

  try {
    await seedReferenceData(database, {
      localPassword: env.SEED_LOCAL_PASSWORD,
    });
    const firstPass = await captureSeededCounts(database);

    await seedReferenceData(database, {
      localPassword: env.SEED_LOCAL_PASSWORD,
    });
    const secondPass = await captureSeededCounts(database);

    if (JSON.stringify(firstPass) !== JSON.stringify(secondPass)) {
      throw new Error(
        "Seed repeatability verification failed: row counts changed on the second pass.",
      );
    }

    console.info(
      `Seed repeatability verified across ${Object.keys(secondPass).length} tracked entity and relationship counts.`,
    );
  } finally {
    await database.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Seed repeatability verification failed.",
  );
  process.exitCode = 1;
});
