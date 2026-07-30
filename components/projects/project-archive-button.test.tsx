import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProjectArchiveButton } from "@/components/projects/project-archive-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/(workspace)/projects/actions", () => ({
  archiveProjectAction: vi.fn(),
}));

describe("ProjectArchiveButton", () => {
  it("exposes an accessible delete action without deleting immediately", () => {
    const markup = renderToStaticMarkup(
      <ProjectArchiveButton
        projectId="project-1"
        projectName="PMS Dashboard"
      />,
    );

    expect(markup).toContain('aria-label="Delete PMS Dashboard"');
    expect(markup).toContain('title="Delete project"');
    expect(markup).not.toContain("Delete Project</button>");
  });
});
