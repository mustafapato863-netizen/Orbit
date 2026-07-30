import { describe, expect, it } from "vitest";
import { canAccessProject } from "@/lib/auth/policy";

describe("Phase 8 authorization boundaries", () => {
  const projectId = "project-a";
  const user = (permissions: string[]) => ({
    permissions,
    projectMemberships: [{ projectId, role: "VIEWER" }],
  });

  it("allows Project Managers to manage Risks and Decisions only in member projects", () => {
    const manager = user(["project.view", "risk.manage", "decision.manage"]);
    expect(canAccessProject(manager, "risk.manage", projectId)).toBe(true);
    expect(canAccessProject(manager, "decision.manage", projectId)).toBe(true);
    expect(canAccessProject(manager, "risk.manage", "project-b")).toBe(false);
  });

  it("allows Reviewers to review Decisions without granting management", () => {
    const reviewer = user(["project.view", "decision.review"]);
    expect(canAccessProject(reviewer, "decision.review", projectId)).toBe(true);
    expect(canAccessProject(reviewer, "decision.manage", projectId)).toBe(false);
    expect(canAccessProject(reviewer, "risk.manage", projectId)).toBe(false);
  });

  it("keeps Viewers read only", () => {
    const viewer = user(["project.view"]);
    expect(canAccessProject(viewer, "project.view", projectId)).toBe(true);
    expect(canAccessProject(viewer, "decision.review", projectId)).toBe(false);
    expect(canAccessProject(viewer, "risk.manage", projectId)).toBe(false);
  });
});
