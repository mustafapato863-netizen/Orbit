import { describe, expect, it } from "vitest";

import { groupProjectsByProjectGroup } from "@/lib/project-groups/group-projects";

function project(
  id: string,
  group?: { id: string; name: string; sortOrder: number },
) {
  return {
    id,
    projectGroup: group ? { ...group, colorToken: "#7157e8" } : null,
  };
}

describe("groupProjectsByProjectGroup", () => {
  it("keeps projects grouped once and places ungrouped projects last", () => {
    const grouped = groupProjectsByProjectGroup([
      project("p-3"),
      project("p-1", { id: "g-2", name: "Operations", sortOrder: 20 }),
      project("p-2", { id: "g-1", name: "Core program", sortOrder: 10 }),
      project("p-4", { id: "g-2", name: "Operations", sortOrder: 20 }),
    ]);

    expect(grouped.map((section) => section.group?.name ?? "Ungrouped")).toEqual([
      "Core program",
      "Operations",
      "Ungrouped",
    ]);
    expect(grouped[1]?.projects.map(({ id }) => id)).toEqual(["p-1", "p-4"]);
  });
});

