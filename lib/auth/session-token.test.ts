import { describe, expect, it } from "vitest";

import {
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session-token";

describe("session tokens", () => {
  it("generates high-entropy URL-safe tokens", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("stores only a deterministic SHA-256 token hash", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
  });
});
