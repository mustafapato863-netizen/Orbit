import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AccessAdminPanel } from "@/components/access/access-admin-panel";

vi.mock("@/app/(workspace)/access/actions", () => ({
  assignRoleAction: vi.fn(),
  createUserAction: vi.fn(),
  removeProjectMembershipAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  setAccountStatusAction: vi.fn(),
  setProjectMembershipAction: vi.fn(),
}));

describe("AccessAdminPanel", () => {
  it("offers public projects during user creation and excludes administrator-only projects", () => {
    const markup = renderToStaticMarkup(
      <AccessAdminPanel
        currentUserId="e898be48-571c-4aa2-bb0e-234063e24fac"
        users={[]}
        roles={[
          {
            id: "6cd4d08b-d971-4450-972d-3f08610a5578",
            name: "Viewer",
            description: null,
          },
        ]}
        projects={[
          {
            id: "32f76a42-8eeb-4665-bc8b-4249f010db2e",
            name: "Visible delivery project",
            code: "PUBLIC-01",
            isPrivate: false,
          },
          {
            id: "04f63394-c3c6-4a53-91ae-cb261f3abfd5",
            name: "Administrator strategy project",
            code: "PRIVATE-01",
            isPrivate: true,
          },
        ]}
      />,
    );

    expect(markup).toContain("Projects this user can see");
    expect(markup).toContain("Visible delivery project");
    expect(markup).not.toContain("Administrator strategy project");
  });
});
