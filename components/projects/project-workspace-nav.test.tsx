import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProjectWorkspaceNav } from "@/components/projects/project-workspace-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/project-1/pipeline",
}));

describe("ProjectWorkspaceNav", () => {
  it("connects all project destinations and marks the current page", () => {
    const markup = renderToStaticMarkup(
      <ProjectWorkspaceNav
        projectId="project-1"
        user={{ permissions: ["project.update", "project.manage_members"] }}
      />,
    );

    for (const href of [
      "/projects/project-1",
      "/projects/project-1/pipeline",
      "/projects/project-1/milestones",
      "/projects/project-1/workstreams",
      "/projects/project-1/risks",
      "/projects/project-1/pilot",
      "/projects/project-1/reports",
      "/projects/project-1/edit",
    ]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("Timeline");
    expect(markup).toContain("Milestones");
    expect(markup).toContain("Plan");
    expect(markup).not.toContain("Deliverables");
    expect(markup).not.toContain("Resources");
  });

  it("keeps settings visible but disabled for read-only users", () => {
    const markup = renderToStaticMarkup(
      <ProjectWorkspaceNav
        projectId="project-1"
        user={{ permissions: ["project.view"] }}
      />,
    );

    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain("Settings");
    expect(markup).toContain('tabindex="-1"');
  });
});
