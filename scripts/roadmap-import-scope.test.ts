import { describe, expect, it } from "vitest";

import {
  buildBusinessArchivePlan,
  buildTechnicalArchivePlan,
  documentCountsForImport,
  phasesForImport,
  storedCountsForImport,
} from "@/scripts/roadmap-import-scope";

const phases = [
  {
    code: "PH-01",
    phaseType: "TECHNICAL" as const,
    workItems: [{ code: "PH-01.W01" }, { code: "PH-01.GATE" }],
  },
  {
    code: "BPH-01",
    phaseType: "BUSINESS" as const,
    workItems: [{ code: "BUS-01.1" }],
  },
  {
    code: "PH-02",
    phaseType: "TECHNICAL" as const,
    workItems: [{ code: "PH-02.W01" }],
  },
];

describe("PMS roadmap import scope", () => {
  it("selects every phase for a full import and technical phases only for a scoped import", () => {
    expect(phasesForImport(phases, "full").map(({ code }) => code)).toEqual([
      "PH-01",
      "BPH-01",
      "PH-02",
    ]);
    expect(
      phasesForImport(phases, "technical-only").map(({ code }) => code),
    ).toEqual(["PH-01", "PH-02"]);
    expect(
      phasesForImport(phases, "business-only").map(({ code }) => code),
    ).toEqual(["BPH-01"]);
  });

  it("reports counts only for records changed by the selected scope", () => {
    const document = {
      phases,
      sharedCapabilities: [{ code: "SC-01" }, { code: "SC-02" }],
    };
    const project = {
      milestones: phases,
      sharedCapabilities: [{ code: "SC-01" }],
    };

    expect(documentCountsForImport(document, "full")).toEqual({
      phases: 3,
      workItems: 4,
      sharedCapabilities: 2,
    });
    expect(documentCountsForImport(document, "technical-only")).toEqual({
      phases: 2,
      workItems: 3,
      sharedCapabilities: 0,
    });
    expect(documentCountsForImport(document, "business-only")).toEqual({
      phases: 1,
      workItems: 1,
      sharedCapabilities: 0,
    });
    expect(storedCountsForImport(project, "technical-only")).toEqual({
      phases: 2,
      workItems: 3,
      sharedCapabilities: 0,
    });
  });

  it("archives omitted technical records without selecting business records", () => {
    const plan = buildTechnicalArchivePlan(
      [
        {
          id: "technical-1",
          code: "PH-01",
          workItems: [
            { id: "keep", code: "PH-01.W01" },
            { id: "omit", code: "PH-01.OLD" },
          ],
        },
        {
          id: "technical-2",
          code: "PH-09",
          workItems: [{ id: "omit-with-phase", code: "PH-09.W01" }],
        },
        {
          id: "business-1",
          code: "BPH-01",
          workItems: [{ id: "business-item", code: "BUS-01.1" }],
        },
      ],
      phasesForImport(phases, "technical-only"),
    );

    expect(plan).toEqual({
      milestoneIds: ["technical-2"],
      workItemIds: ["omit", "omit-with-phase"],
    });
  });

  it("archives omitted business records without selecting technical records", () => {
    const plan = buildBusinessArchivePlan(
      [
        {
          id: "technical-1",
          code: "PH-01",
          workItems: [{ id: "technical-item", code: "PH-01.W01" }],
        },
        {
          id: "business-1",
          code: "BPH-01",
          workItems: [
            { id: "keep", code: "BUS-01.1" },
            { id: "omit", code: "BUS-01.OLD" },
          ],
        },
        {
          id: "business-2",
          code: "BPH-09",
          workItems: [{ id: "omit-with-phase", code: "BUS-09.1" }],
        },
      ],
      phasesForImport(phases, "business-only"),
    );

    expect(plan).toEqual({
      milestoneIds: ["business-2"],
      workItemIds: ["omit", "omit-with-phase"],
    });
  });
});
