import type { Prisma } from "@/generated/prisma/client";

/**
 * Repositories receive a transaction-compatible client. The application
 * service owns the transaction boundary and may pass either the singleton
 * Prisma client or an interactive transaction client.
 */
export type RepositoryClient = Prisma.TransactionClient;

export type ProjectScope = Readonly<{
  projectId: string;
}>;

export abstract class Repository {
  protected constructor(protected readonly database: RepositoryClient) {}
}
