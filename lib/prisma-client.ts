import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientOptions = {
  logWarnings?: boolean;
};

/**
 * Node's pg connection-string parser currently treats sslmode=require as
 * certificate verification. Supabase's pooler commonly presents a chain
 * that is trusted by libpq but not by Node's default CA store. This flag
 * restores libpq-compatible `require` semantics without disabling TLS.
 */
export function normalizePostgresConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const isSupabasePooler =
      url.hostname === "pooler.supabase.com" ||
      url.hostname.endsWith(".pooler.supabase.com");

    // Vercel/Next.js creates short-lived server instances. Supabase's 5432
    // endpoint is session pooling and caps the number of concurrently held
    // clients (often at 15). Use the transaction pooler for application
    // queries so idle serverless instances do not consume a dedicated
    // database session. Prisma's pg adapter does not cache named prepared
    // statements unless a statementNameGenerator is supplied, so it is
    // compatible with transaction pooling.
    if (isSupabasePooler && url.port === "5432") {
      url.port = "6543";
    }

    if (
      (url.protocol === "postgresql:" || url.protocol === "postgres:") &&
      url.searchParams.get("sslmode") === "require" &&
      !url.searchParams.has("uselibpqcompat")
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function createPrismaClient(
  connectionString: string,
  { logWarnings = false }: PrismaClientOptions = {},
) {
  const adapter = new PrismaPg({
    connectionString: normalizePostgresConnectionString(connectionString),
    // Bound the client-side pool. Transaction pooling handles the database
    // connection reuse; a small per-instance pool also prevents one server
    // instance from monopolising Supavisor client slots.
    max: 5,
  });

  return new PrismaClient({
    adapter,
    // Supabase pooler round trips are slower than a local PostgreSQL socket.
    // Keep transactions bounded while avoiding premature five-second expiry
    // during multi-write project workflows.
    transactionOptions: { maxWait: 30_000, timeout: 120_000 },
    log: logWarnings ? ["warn", "error"] : ["error"],
  });
}
