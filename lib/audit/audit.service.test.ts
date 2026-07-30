import { describe, expect, it, vi } from "vitest";

import {
  recordAuditEntry,
  sanitizeAuditValue,
} from "@/lib/audit/audit.service";

describe("audit payload sanitization", () => {
  it("redacts sensitive keys recursively without changing safe context", () => {
    expect(
      sanitizeAuditValue({
        projectName: "Orbit",
        nested: {
          passwordHash: "must-not-survive",
          sessionToken: "must-not-survive",
          status: "ACTIVE",
        },
        values: [{ authSecret: "must-not-survive" }, "safe"],
      }),
    ).toEqual({
      projectName: "Orbit",
      nested: {
        passwordHash: "[REDACTED]",
        sessionToken: "[REDACTED]",
        status: "ACTIVE",
      },
      values: [{ authSecret: "[REDACTED]" }, "safe"],
    });
  });

  it("sanitizes all JSON audit sections before persistence", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit-1" });

    await recordAuditEntry(
      { auditLog: { create } } as never,
      {
        action: "security.test",
        entityType: "Test",
        entityId: "test-1",
        beforeState: { databaseUrl: "must-not-survive" },
        afterState: { safe: true },
        metadata: { authorization: "must-not-survive" },
      },
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        beforeState: { databaseUrl: "[REDACTED]" },
        afterState: { safe: true },
        metadata: { authorization: "[REDACTED]" },
      }),
    });
  });
});
