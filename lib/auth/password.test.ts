import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes passwords with bcrypt and verifies without storing plaintext", async () => {
    const password = "Strong-local-passphrase-42!";
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", hash)).resolves.toBe(
      false,
    );
  });
});
