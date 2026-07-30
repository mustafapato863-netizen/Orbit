import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/11111111-1111-1111-1111-111111111111/milestones/new",
}));

describe("Breadcrumbs", () => {
  it("keeps custom eyebrow labels clickable through the pathname trail", () => {
    const markup = renderToStaticMarkup(
      <Breadcrumbs customEyebrow="PMS" />,
    );

    expect(markup).toContain('href="/projects"');
    expect(markup).toContain(
      'href="/projects/11111111-1111-1111-1111-111111111111"',
    );
    expect(markup).toContain("PMS");
    expect(markup).toContain('href="/projects/11111111-1111-1111-1111-111111111111/milestones"');
  });
});
