import { describe, expect, it } from "vitest";

import {
  nextChildCode,
  nextSequenceCode,
} from "@/lib/projects/code-generation";

describe("automatic planning codes", () => {
  it("creates the next stable project or milestone sequence", () => {
    expect(nextSequenceCode("PRJ", ["PMS", "PRJ-001", "PRJ-009"])).toBe(
      "PRJ-010",
    );
    expect(nextSequenceCode("MS", ["PH-01", "BPH-01"])).toBe("MS-001");
  });

  it("creates hierarchical child codes without reusing archived numbers", () => {
    expect(
      nextChildCode("MS-004", ["MS-004.1", "MS-004.2", "LEGACY-1"]),
    ).toBe("MS-004.3");
  });
});
