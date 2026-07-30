import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import WorkspaceError from "@/app/(workspace)/error";
import WorkspaceLoading from "@/app/(workspace)/loading";

describe("workspace release states", () => {
  it("renders an accessible loading state", () => {
    const markup = renderToStaticMarkup(<WorkspaceLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading workspace data");
  });

  it("renders a recoverable, non-sensitive error state", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceError error={new Error("sensitive detail")} reset={vi.fn()} />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("sensitive detail");
  });
});
