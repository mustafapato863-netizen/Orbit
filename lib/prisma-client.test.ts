import { describe, expect, it } from "vitest";

import { normalizePostgresConnectionString } from "@/lib/prisma-client";

describe("PostgreSQL connection configuration", () => {
  it("enables libpq-compatible SSL semantics for Supabase-style URLs", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://postgres:password@pooler.supabase.com:5432/postgres?sslmode=require",
    );

    expect(result).toContain(":6543/");
    expect(result).toContain("sslmode=require");
    expect(result).toContain("uselibpqcompat=true");
  });

  it("leaves direct PostgreSQL and existing transaction-pooler URLs unchanged", () => {
    const direct = normalizePostgresConnectionString(
      "postgresql://postgres:password@localhost:5432/project_management",
    );
    const transaction = normalizePostgresConnectionString(
      "postgresql://postgres:password@pooler.supabase.com:6543/postgres",
    );

    expect(direct).toContain("localhost:5432");
    expect(transaction).toContain("pooler.supabase.com:6543");
  });

  it("does not add the compatibility flag to non-SSL URLs", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://postgres:password@localhost:5432/project_management",
    );

    expect(result).not.toContain("uselibpqcompat");
  });
});
