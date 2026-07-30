import { describe, expect, it } from "vitest";

import { canAccessProject } from "@/lib/auth/policy";

describe("Phase 5 technical execution access restrictions", () => {
  const projectId = "project-a";

  it("allows Project Managers to manage execution only in member projects", () => {
    const manager = {
      permissions: [
        "project.view",
        "work_item.manage",
        "shared_capability.manage",
      ],
      projectMemberships: [{ projectId, role: "PROJECT_MANAGER" }],
    };

    expect(canAccessProject(manager, "work_item.manage", projectId)).toBe(true);
    expect(
      canAccessProject(manager, "shared_capability.manage", projectId),
    ).toBe(true);
    expect(
      canAccessProject(manager, "work_item.manage", "project-b"),
    ).toBe(false);
  });

  it("grants Technical Leads assigned-update permissions but not management", () => {
    const technicalLead = {
      permissions: [
        "project.view",
        "work_item.update_assigned",
        "shared_capability.update_assigned",
      ],
      projectMemberships: [{ projectId, role: "TECHNICAL_LEAD" }],
    };

    expect(
      canAccessProject(
        technicalLead,
        "work_item.update_assigned",
        projectId,
      ),
    ).toBe(true);
    expect(
      canAccessProject(
        technicalLead,
        "shared_capability.update_assigned",
        projectId,
      ),
    ).toBe(true);
    expect(canAccessProject(technicalLead, "work_item.manage", projectId)).toBe(
      false,
    );
  });

  it("keeps Viewer access read only", () => {
    const viewer = {
      permissions: ["project.view"],
      projectMemberships: [{ projectId, role: "VIEWER" }],
    };

    expect(canAccessProject(viewer, "project.view", projectId)).toBe(true);
    expect(canAccessProject(viewer, "work_item.manage", projectId)).toBe(false);
    expect(
      canAccessProject(
        viewer,
        "shared_capability.update_assigned",
        projectId,
      ),
    ).toBe(false);
  });
});
