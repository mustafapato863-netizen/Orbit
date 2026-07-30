import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns a non-cached service heartbeat without environment details", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload).toMatchObject({
      status: "ok",
      service: "orbit-project-manager",
    });
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("DATABASE_URL");
  });
});
