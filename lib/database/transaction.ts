import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type TransactionOperation<T> = (
  transaction: Prisma.TransactionClient,
) => Promise<T>;

export function withTransaction<T>(operation: TransactionOperation<T>) {
  return prisma.$transaction(operation);
}
