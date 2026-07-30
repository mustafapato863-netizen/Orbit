import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  getOpenedProjectHref,
  Sidebar,
} from "@/components/layout/sidebar";
import type { SessionUser } from "@/lib/auth/session";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/project-1/pipeline",
}));

describe("Sidebar", () => {
  it("keeps global navigation separate from project navigation", () => {
    const markup = renderToStaticMarkup(
      <Sidebar
        user={
          {
            id: "user-1",
            email: "manager@example.com",
            displayName: "Project Manager",
            roleNames: [],
            permissions: [],
            mustChangePassword: false,
            projectMemberships: [],
          } satisfies SessionUser
        }
      />,
    );

    expect(markup).toContain("Workspace");
    expect(markup).toContain("Projects");
    expect(markup).toContain('href="/projects/project-1"');
    expect(markup).toContain('href="/projects"');
    expect(markup).not.toContain(">Timeline<");
    expect(markup).not.toContain(">Plan<");
    expect(markup).not.toContain("Risks &amp; Decisions");
  });

  it("uses the open project as the workspace destination", () => {
    expect(getOpenedProjectHref("/projects/project-1/pipeline")).toBe(
      "/projects/project-1",
    );
    expect(getOpenedProjectHref("/projects")).toBe("/");
    expect(getOpenedProjectHref("/projects/new")).toBe("/");
  });
});
