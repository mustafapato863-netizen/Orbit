import "dotenv/config";

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  MembershipRole,
  PrismaClient,
  ProjectStatus,
} from "../generated/prisma/client";

const stateDirectory = resolve(".playwright");
const statePath = resolve(stateDirectory, "qa-state.json");
const qaProjectCode = "QA-P11";
const accountDefinitions = {
  administrator: {
    email: "qa-phase11-admin@orbit.local",
    displayName: "Phase 11 Administrator",
    role: "Administrator",
    mustChangePassword: false,
  },
  viewer: {
    email: "qa-phase11-viewer@orbit.local",
    displayName: "Phase 11 Viewer",
    role: "Viewer",
    mustChangePassword: false,
  },
  outsider: {
    email: "qa-phase11-outsider@orbit.local",
    displayName: "Phase 11 Scoped Outsider",
    role: "Viewer",
    mustChangePassword: false,
  },
  forcedPassword: {
    email: "qa-phase11-forced@orbit.local",
    displayName: "Phase 11 Password Change",
    role: "Viewer",
    mustChangePassword: true,
  },
} as const;

export type QaState = {
  password: string;
  projectId: string;
  pmsProjectId: string;
  accounts: Record<
    keyof typeof accountDefinitions,
    { email: string; userId: string }
  >;
};

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Playwright QA setup.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error"],
  });
}

async function removeQaRecords(database: PrismaClient) {
  const emails = Object.values(accountDefinitions).map(({ email }) => email);
  const [users, projects] = await Promise.all([
    database.user.findMany({
      where: { normalizedEmail: { in: emails } },
      select: { id: true },
    }),
    database.project.findMany({
      where: { code: qaProjectCode },
      select: { id: true },
    }),
  ]);
  const userIds = users.map(({ id }) => id);
  const projectIds = projects.map(({ id }) => id);

  await database.$transaction(async (transaction) => {
    if (userIds.length || projectIds.length) {
      await transaction.auditLog.deleteMany({
        where: {
          OR: [
            ...(userIds.length ? [{ actorId: { in: userIds } }] : []),
            ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
          ],
        },
      });
    }
    await transaction.project.deleteMany({ where: { code: qaProjectCode } });
    await transaction.user.deleteMany({
      where: { normalizedEmail: { in: emails } },
    });
  });
}

export async function prepareQaData() {
  const database = createDatabase();
  try {
    await removeQaRecords(database);
    const password = `Qa!${randomBytes(18).toString("base64url")}9a`;
    const passwordHash = await bcrypt.hash(password, 12);
    const roles = await database.role.findMany({
      where: {
        name: {
          in: [...new Set(Object.values(accountDefinitions).map(({ role }) => role))],
        },
        archivedAt: null,
      },
      select: { id: true, name: true },
    });
    const rolesByName = new Map(roles.map((role) => [role.name, role.id]));
    const pmsProject = await database.project.findUnique({
      where: { code: "PMS" },
      select: { id: true },
    });
    if (!pmsProject) {
      throw new Error(
        "The seeded PMS project is required. Run npm run prisma:seed first.",
      );
    }

    const state = await database.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          code: qaProjectCode,
          slug: "phase-11-release-qa",
          name: "Phase 11 Release QA",
          description: "Ephemeral project used only by the release closure suite.",
          status: ProjectStatus.ACTIVE,
          progress: 25,
        },
        select: { id: true },
      });
      const accounts = {} as QaState["accounts"];

      for (const [key, account] of Object.entries(accountDefinitions) as Array<
        [keyof typeof accountDefinitions, (typeof accountDefinitions)[keyof typeof accountDefinitions]]
      >) {
        const roleId = rolesByName.get(account.role);
        if (!roleId) {
          throw new Error(`The ${account.role} seed role is required.`);
        }
        const user = await transaction.user.create({
          data: {
            email: account.email,
            normalizedEmail: account.email,
            displayName: account.displayName,
            passwordHash,
            mustChangePassword: account.mustChangePassword,
            userRoles: { create: { roleId } },
          },
          select: { id: true },
        });
        accounts[key] = { email: account.email, userId: user.id };
      }

      await transaction.projectMember.createMany({
        data: [
          {
            projectId: project.id,
            userId: accounts.viewer.userId,
            role: MembershipRole.VIEWER,
          },
          {
            projectId: pmsProject.id,
            userId: accounts.viewer.userId,
            role: MembershipRole.VIEWER,
          },
        ],
      });

      return {
        password,
        projectId: project.id,
        pmsProjectId: pmsProject.id,
        accounts,
      } satisfies QaState;
    });

    await mkdir(stateDirectory, { recursive: true });
    await writeFile(statePath, JSON.stringify(state), {
      encoding: "utf8",
      mode: 0o600,
    });
  } finally {
    await database.$disconnect();
  }
}

export async function cleanupQaData() {
  const database = createDatabase();
  try {
    await removeQaRecords(database);
  } finally {
    await database.$disconnect();
    await rm(statePath, { force: true });
  }
}

export async function loadQaState() {
  return JSON.parse(await readFile(statePath, "utf8")) as QaState;
}
