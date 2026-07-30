import { describe, expect, it } from "vitest";
import { canAccessProject } from "@/lib/auth/policy";

describe("Phase 9 Pilot authorization boundaries", () => {
  const projectId = "project-a";
  const user = (permissions: string[]) => ({
    permissions,
    projectMemberships: [{ projectId, role: "VIEWER" }],
  });

  it("allows Project Managers to configure but not approve Pilot", () => {
    const manager = user(["project.view", "pilot.manage"]);
    expect(canAccessProject(manager, "pilot.manage", projectId)).toBe(true);
    expect(canAccessProject(manager, "pilot.review", projectId)).toBe(false);
    expect(canAccessProject(manager, "pilot.manage", "project-b")).toBe(false);
  });

  it("allows Reviewers to approve but not configure Pilot", () => {
    const reviewer = user(["project.view", "pilot.review"]);
    expect(canAccessProject(reviewer, "pilot.review", projectId)).toBe(true);
    expect(canAccessProject(reviewer, "pilot.manage", projectId)).toBe(false);
  });

  it("keeps Viewers read only", () => {
    const viewer = user(["project.view"]);
    expect(canAccessProject(viewer, "project.view", projectId)).toBe(true);
    expect(canAccessProject(viewer, "pilot.manage", projectId)).toBe(false);
    expect(canAccessProject(viewer, "pilot.review", projectId)).toBe(false);
  });
});
