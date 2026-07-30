import { describe, expect, it } from "vitest";

import { canAccessProject } from "@/lib/auth/policy";

describe("Phase 4 project access restrictions", () => {
  const projectId = "project-a";

  it("allows a Viewer to read only an assigned project", () => {
    const viewer = {
      permissions: ["project.view"],
      projectMemberships: [{ projectId, role: "VIEWER" }],
    };

    expect(canAccessProject(viewer, "project.view", projectId)).toBe(true);
    expect(canAccessProject(viewer, "project.view", "project-b")).toBe(false);
    expect(canAccessProject(viewer, "project.update", projectId)).toBe(false);
  });

  it("allows Project Managers to mutate only member projects", () => {
    const manager = {
      permissions: [
        "project.view",
        "project.update",
        "project.manage_members",
        "milestone.manage",
      ],
      projectMemberships: [{ projectId, role: "PROJECT_MANAGER" }],
    };

    expect(canAccessProject(manager, "project.update", projectId)).toBe(true);
    expect(canAccessProject(manager, "milestone.manage", projectId)).toBe(true);
    expect(canAccessProject(manager, "project.update", "project-b")).toBe(false);
  });

  it("allows Administrators across the project membership boundary", () => {
    const administrator = {
      permissions: ["system.manage"],
      projectMemberships: [],
    };

    expect(
      canAccessProject(administrator, "milestone.manage", "any-project"),
    ).toBe(true);
  });

  it("keeps administrator-only projects hidden from ordinary members", () => {
    const manager = {
      permissions: ["project.view", "project.update"],
      projectMemberships: [
        {
          projectId,
          role: "PROJECT_MANAGER",
          isPrivate: true,
        },
      ],
    };

    expect(canAccessProject(manager, "project.view", projectId)).toBe(false);
    expect(canAccessProject(manager, "project.update", projectId)).toBe(false);
  });
});
