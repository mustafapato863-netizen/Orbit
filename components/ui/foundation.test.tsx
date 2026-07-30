import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";

describe("foundation UI states", () => {
  it("communicates status and risk with text as well as color", () => {
    const markup = renderToStaticMarkup(
      <div>
        <StatusBadge status="blocked" />
        <RiskBadge level="critical" />
      </div>,
    );

    expect(markup).toContain("Blocked");
    expect(markup).toContain("Critical risk");
  });

  it("renders accessible loading and error semantics", () => {
    const markup = renderToStaticMarkup(
      <div>
        <LoadingState label="Loading test data" rows={2} />
        <ErrorState description="A test error occurred." />
      </div>,
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Loading test data");
    expect(markup).toContain("A test error occurred.");
  });

  it("renders an explicit empty-state explanation", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        title="No records"
        description="Create a record to begin."
      />,
    );

    expect(markup).toContain("No records");
    expect(markup).toContain("Create a record to begin.");
  });
});
