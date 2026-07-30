import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  createUserSchema,
  normalizeEmail,
  signInSchema,
} from "@/lib/auth/auth.schemas";

describe("authentication validation", () => {
  it("normalizes email consistently", () => {
    expect(normalizeEmail("  Admin@Orbit.Local ")).toBe("admin@orbit.local");
  });

  it("rejects open redirect destinations", () => {
    expect(
      signInSchema.safeParse({
        email: "viewer@orbit.local",
        password: "value",
        nextPath: "//example.com",
      }).success,
    ).toBe(false);
  });

  it("enforces the password policy and confirmation", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "Old-password-42!",
        newPassword: "weak",
        confirmPassword: "weak",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "Old-password-42!",
        newPassword: "New-password-84!",
        confirmPassword: "New-password-84!",
      }).success,
    ).toBe(true);
  });

  it("validates project access selected during account creation", () => {
    const result = createUserSchema.safeParse({
      displayName: "Delivery Viewer",
      email: "viewer@example.com",
      temporaryPassword: "Temporary-password-42!",
      roleId: "8ac61767-19d5-4d84-9b0b-f33a232f8b45",
      projectIds: [
        "df95768d-e345-4b53-9076-cf31749a7158",
        "9dd81da1-602d-4526-a434-52aa6405c428",
      ],
      membershipRole: "VIEWER",
    });

    expect(result.success).toBe(true);
  });
});
