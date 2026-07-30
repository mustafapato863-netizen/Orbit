import "dotenv/config";

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Prisma, PrismaClient } from "../generated/prisma/client";
import { passwordSchema } from "../lib/auth/auth.schemas";
import { hashPassword } from "../lib/auth/password";
import { parseServerEnv } from "../lib/env-schema";
import { createPrismaClient } from "../lib/prisma-client";
import {
  permissionSeeds,
  retiredPermissionCodes,
  localAccountSeeds,
  roleSeeds,
  validateSeedDefinitions,
  workstreamSeeds,
} from "./seed-data";
import { upsertPmsDashboardProject } from "./pms-seed";
import {
  pmsMilestoneSeeds,
  pmsSharedCapabilitySeeds,
  pmsWorkItemSeeds,
} from "./pms-seed-data";
import {
  pmsDecisionSeeds,
  pmsRiskSeeds,
} from "./pms-governance-seed-data";
import {
  pmsPilotCriterionSeeds,
  pmsPilotIssueSeeds,
  pmsPilotTeamSeeds,
} from "./pms-pilot-seed-data";

type SeedOptions = {
  localPasswordHash?: string;
};

export async function upsertReferenceData(
  transaction: Prisma.TransactionClient,
  options: SeedOptions = {},
) {
  const permissionsByCode = new Map<string, { id: string }>();

  for (const permission of permissionSeeds) {
    const storedPermission = await transaction.permission.upsert({
      where: { code: permission.code },
      create: permission,
      update: {
        name: permission.name,
        description: permission.description,
        archivedAt: null,
      },
      select: { id: true },
    });

    permissionsByCode.set(permission.code, storedPermission);
  }

  await transaction.permission.updateMany({
    where: { code: { in: [...retiredPermissionCodes] } },
    data: { archivedAt: new Date() },
  });

  for (const role of roleSeeds) {
    const storedRole = await transaction.role.upsert({
      where: { name: role.name },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      update: {
        description: role.description,
        isSystem: role.isSystem,
        archivedAt: null,
      },
      select: { id: true },
    });

    for (const permissionCode of role.permissionCodes) {
      const permission = permissionsByCode.get(permissionCode);

      if (!permission) {
        throw new Error("Seed permission lookup failed.");
      }

      await transaction.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: storedRole.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: storedRole.id,
          permissionId: permission.id,
        },
        update: {},
      });
    }

    const permissionIds = role.permissionCodes.map((permissionCode) => {
      const permission = permissionsByCode.get(permissionCode);
      if (!permission) {
        throw new Error("Seed permission lookup failed.");
      }
      return permission.id;
    });

    await transaction.rolePermission.deleteMany({
      where: {
        roleId: storedRole.id,
        permissionId: { notIn: permissionIds },
      },
    });
  }

  if (options.localPasswordHash) {
    const rolesByName = new Map(
      await transaction.role
        .findMany({
          where: { name: { in: localAccountSeeds.map(({ roleName }) => roleName) } },
          select: { id: true, name: true },
        })
        .then((roles) => roles.map((role) => [role.name, role] as const)),
    );

    for (const account of localAccountSeeds) {
      const role = rolesByName.get(account.roleName);
      if (!role) {
        throw new Error("Local account role lookup failed.");
      }

      const user = await transaction.user.upsert({
        where: { normalizedEmail: account.email },
        create: {
          email: account.email,
          normalizedEmail: account.email,
          displayName: account.displayName,
          passwordHash: options.localPasswordHash,
          mustChangePassword: true,
        },
        update: {
          email: account.email,
          displayName: account.displayName,
          isActive: true,
          archivedAt: null,
        },
        select: { id: true, passwordHash: true },
      });

      if (!user.passwordHash) {
        await transaction.user.update({
          where: { id: user.id },
          data: {
            passwordHash: options.localPasswordHash,
            mustChangePassword: true,
          },
        });
      }

      await transaction.userRole.upsert({
        where: {
          userId_roleId: { userId: user.id, roleId: role.id },
        },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
    }
  }

  await upsertPmsDashboardProject(transaction);
}

export async function seedReferenceData(
  database: PrismaClient,
  options: { localPassword?: string } = {},
) {
  validateSeedDefinitions();
  const localPasswordHash = options.localPassword
    ? await hashPassword(passwordSchema.parse(options.localPassword))
    : undefined;

  await database.$transaction((transaction) =>
    upsertReferenceData(transaction, { localPasswordHash }),
  );
}

export async function main() {
  const env = parseServerEnv(process.env);
  const database = createPrismaClient(env.DATABASE_URL);

  try {
    await seedReferenceData(database, {
      localPassword: env.SEED_LOCAL_PASSWORD,
    });
    console.info(
      `Seed complete (${workstreamSeeds.length} workstreams, ${roleSeeds.length} roles, ${permissionSeeds.length} permissions, ${env.SEED_LOCAL_PASSWORD ? localAccountSeeds.length : 0} local accounts, ${pmsMilestoneSeeds.length} PMS milestones, ${pmsWorkItemSeeds.length} Work Items, ${pmsSharedCapabilitySeeds.length} canonical Shared Capabilities, ${pmsRiskSeeds.length} Risks, ${pmsDecisionSeeds.length} Decisions, ${pmsPilotTeamSeeds.length} Pilot teams, ${pmsPilotCriterionSeeds.length} Pilot criteria, ${pmsPilotIssueSeeds.length} Pilot issues).`,
    );
  } catch (error) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : null;

    console.error(
      errorCode
        ? `Reference seed failed (${errorCode}).`
        : "Reference seed failed with an unexpected error.",
    );
    process.exitCode = 1;
  } finally {
    await database.$disconnect();
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  void main();
}
