import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  authorizationErrorResponse: vi.fn(() => Response.json({ error: "Forbidden" }, { status: 403 })),
  generateManagementReport: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requirePermission: mocks.requirePermission,
  authorizationErrorResponse: mocks.authorizationErrorResponse,
}));

vi.mock("@/lib/reports/report.service", () => ({
  generateManagementReport: mocks.generateManagementReport,
  ReportDomainError: class ReportDomainError extends Error {},
}));

import { handleReportDownload } from "@/lib/reports/report.route";

describe("report download authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects the download before generation when report.export is denied", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("denied"));

    const response = await handleReportDownload(
      new Request("https://orbit.example/api/report", { method: "POST" }),
      "POWERPOINT",
      Promise.resolve({ projectId: "project-1" }),
    );

    expect(response.status).toBe(403);
    expect(mocks.requirePermission).toHaveBeenCalledWith("report.export", "project-1");
    expect(mocks.generateManagementReport).not.toHaveBeenCalled();
  });

  it("returns a private attachment after project-scoped authorization", async () => {
    mocks.requirePermission.mockResolvedValue({ user: { id: "user-1" } });
    mocks.generateManagementReport.mockResolvedValue({
      buffer: Buffer.from("PK-test"),
      fileName: "orbit-review.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const response = await handleReportDownload(
      new Request("https://orbit.example/api/report", { method: "POST" }),
      "EXCEL",
      Promise.resolve({ projectId: "project-1" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("orbit-review.xlsx");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(mocks.generateManagementReport).toHaveBeenCalledWith("user-1", "project-1", "EXCEL");
  });

  it("rejects a cross-origin request before authorization or generation", async () => {
    const response = await handleReportDownload(
      new Request("https://orbit.example/api/report", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
      }),
      "POWERPOINT",
      Promise.resolve({ projectId: "project-1" }),
    );

    expect(response.status).toBe(403);
    expect(mocks.requirePermission).not.toHaveBeenCalled();
    expect(mocks.generateManagementReport).not.toHaveBeenCalled();
  });
});
