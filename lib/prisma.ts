import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { createPrismaClient } from "@/lib/prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient(env.DATABASE_URL, {
    logWarnings: env.NODE_ENV === "development",
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
