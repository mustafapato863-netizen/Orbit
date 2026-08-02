import { describe, expect, it } from "vitest";

import { normalizePostgresConnectionString } from "@/lib/prisma-client";

describe("PostgreSQL connection configuration", () => {
  it("enables libpq-compatible SSL semantics for Supabase-style URLs", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://postgres:password@pooler.supabase.com:5432/postgres?sslmode=require",
    );

    expect(result).toContain("sslmode=require");
    expect(result).toContain("uselibpqcompat=true");
  });

  it("does not add the compatibility flag to non-SSL URLs", () => {
    const result = normalizePostgresConnectionString(
      "postgresql://postgres:password@localhost:5432/project_management",
    );

    expect(result).not.toContain("uselibpqcompat");
  });
});
