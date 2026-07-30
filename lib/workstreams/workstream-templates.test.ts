import { describe, expect, it } from "vitest";

import {
  projectTypes,
  templateWorkstreams,
} from "@/lib/workstreams/workstream-templates";

describe("project workstream templates", () => {
  it("keeps a custom project blank", () => {
    expect(templateWorkstreams("CUSTOM")).toEqual([]);
  });

  it("provides project-specific structures without duplicate local keys", () => {
    for (const projectType of projectTypes.filter((type) => type !== "CUSTOM")) {
      const workstreams = templateWorkstreams(projectType);
      expect(workstreams.length).toBeGreaterThan(0);
      expect(new Set(workstreams.map(({ code }) => code)).size).toBe(workstreams.length);
      expect(new Set(workstreams.map(({ slug }) => slug)).size).toBe(workstreams.length);
      expect(workstreams.map(({ sortOrder }) => sortOrder)).toEqual(
        workstreams.map((_, index) => (index + 1) * 10),
      );
    }
  });
});
