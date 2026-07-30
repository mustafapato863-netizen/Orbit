import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientOptions = {
  logWarnings?: boolean;
};

export function createPrismaClient(
  connectionString: string,
  { logWarnings = false }: PrismaClientOptions = {},
) {
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: logWarnings ? ["warn", "error"] : ["error"],
  });
}
