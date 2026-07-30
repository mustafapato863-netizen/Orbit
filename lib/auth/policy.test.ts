import { describe, expect, it } from "vitest";

import {
  canUpdateAssignedWorkItem,
  hasPermission,
  hasProjectMembership,
} from "@/lib/auth/policy";

const user = {
  id: "user-1",
  permissions: ["project.view", "work_item.update_assigned"],
  projectMemberships: [{ projectId: "project-1", role: "TECHNICAL_LEAD" }],
};

describe("authorization policy", () => {
  it("requires both a permission and project membership", () => {
    expect(hasPermission(user, "project.view")).toBe(true);
    expect(hasPermission(user, "risk.manage")).toBe(false);
    expect(hasProjectMembership(user, "project-1")).toBe(true);
    expect(hasProjectMembership(user, "project-2")).toBe(false);
  });

  it("allows system administrators across permission and project boundaries", () => {
    const administrator = {
      permissions: ["system.manage"],
      projectMemberships: [],
    };

    expect(hasPermission(administrator, "decision.review")).toBe(true);
    expect(hasProjectMembership(administrator, "any-project")).toBe(true);
  });

  it("does not allow a membership to bypass administrator-only visibility", () => {
    expect(
      hasProjectMembership(
        {
          permissions: ["project.view"],
          projectMemberships: [
            {
              projectId: "private-project",
              role: "PROJECT_MANAGER",
              isPrivate: true,
            },
          ],
        },
        "private-project",
      ),
    ).toBe(false);
    expect(
      hasProjectMembership(
        {
          permissions: ["system.manage"],
          projectMemberships: [],
        },
        "private-project",
      ),
    ).toBe(true);
  });

  it("limits Technical Leads to work assigned to them", () => {
    expect(canUpdateAssignedWorkItem(user, "user-1")).toBe(true);
    expect(canUpdateAssignedWorkItem(user, "user-2")).toBe(false);
    expect(canUpdateAssignedWorkItem(user, null)).toBe(false);
  });

  it("allows project work managers to update any assigned owner", () => {
    expect(
      canUpdateAssignedWorkItem(
        { id: "manager", permissions: ["work_item.manage"] },
        "someone-else",
      ),
    ).toBe(true);
  });
});
