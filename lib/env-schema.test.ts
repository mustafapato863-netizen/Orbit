import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env-schema";

describe("parseServerEnv", () => {
  it("validates the database URL and applies safe foundation defaults", () => {
    const result = parseServerEnv({
      DATABASE_URL:
        "postgresql://postgres:placeholder@localhost:5432/project_management?schema=public",
    });

    expect(result).toEqual({
      NODE_ENV: "development",
      DATABASE_URL:
        "postgresql://postgres:placeholder@localhost:5432/project_management?schema=public",
      APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: "Orbit Project Manager",
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("rejects non-PostgreSQL connection URLs without exposing their value", () => {
    const invalidValue = "https://user:secret@example.com/database";

    expect(() =>
      parseServerEnv({
        DATABASE_URL: invalidValue,
      }),
    ).toThrow("Invalid server environment configuration. Check: DATABASE_URL.");

    try {
      parseServerEnv({ DATABASE_URL: invalidValue });
    } catch (error) {
      expect(String(error)).not.toContain(invalidValue);
      expect(String(error)).not.toContain("secret");
    }
  });

  it("rejects a configured authentication secret that is too short", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL:
          "postgresql://postgres:placeholder@localhost:5432/project_management",
        AUTH_SECRET: "too-short",
      }),
    ).toThrow("AUTH_SECRET");
  });

  it("treats an empty local seed password as disabled", () => {
    const result = parseServerEnv({
      DATABASE_URL:
        "postgresql://postgres:placeholder@localhost:5432/project_management",
      SEED_LOCAL_PASSWORD: "",
    });

    expect(result.SEED_LOCAL_PASSWORD).toBeUndefined();
  });
});
