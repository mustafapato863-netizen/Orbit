import { describe, expect, it } from "vitest";

import {
  PMS_PROJECT_SEED,
  pmsMilestoneSeeds,
  pmsSharedCapabilitySeeds,
  pmsWorkItemSeeds,
  validatePmsSeedDefinitions,
} from "@/prisma/pms-seed-data";
import {
  pmsDecisionSeeds,
  pmsRiskSeeds,
} from "@/prisma/pms-governance-seed-data";
import {
  pmsPilotCapabilitySeeds,
  pmsPilotCriterionSeeds,
  pmsPilotTeamSeeds,
} from "@/prisma/pms-pilot-seed-data";

const APPROVED_PHASES = [
  "Requirements, Scope & Solution Architecture",
  "Database, Data Model & KPI Configuration",
  "Core PMS Engine, Backend APIs & Access Control",
  "Data Intake, Processing & Operational Workflows",
  "Frontend, BI Dashboards & PMS Workspaces",
  "Integrated QA, Security, UAT & Controlled Pilot",
  "Production Rollout, Handover & Sign-off",
  "Business Delivery \u2014 Operational Scope, KPI Governance & Team Onboarding",
  "Business Delivery \u2014 Employee Performance",
  "Business Delivery \u2014 Team & Department Performance",
  "Business Delivery \u2014 Managerial, Corporate & Strategic Performance",
  "Business Delivery \u2014 Performance Insights & Classification",
  "Business Delivery \u2014 Planning, Corrective Actions & Follow-up",
  "Business Delivery \u2014 Reporting, Management Review & Business Adoption",
] as const;

describe("PMS Dashboard seed definitions", () => {
  it("defines the approved 14 phases in source order", () => {
    expect(pmsMilestoneSeeds.map(({ name }) => name)).toEqual(APPROVED_PHASES);
    expect(
      pmsMilestoneSeeds.every(
        ({ releaseHorizon }) => releaseHorizon === "RELEASE_1",
      ),
    ).toBe(true);
  });

  it("preserves the project summary and every phase envelope", () => {
    expect(PMS_PROJECT_SEED.progress).toBe(61);
    expect(PMS_PROJECT_SEED.startDate.toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(PMS_PROJECT_SEED.targetDate.toISOString()).toBe(
      "2026-09-30T00:00:00.000Z",
    );
    expect(
      pmsMilestoneSeeds.map(({ code, progress, startDate, dueDate }) => ({
        code,
        progress,
        startDate,
        dueDate,
        itemCount: pmsWorkItemSeeds.filter(
          ({ milestoneCode }) => milestoneCode === code,
        ).length,
      })),
    ).toEqual([
      { code: "PH-01", progress: 100, startDate: "2026-06-01", dueDate: "2026-06-10", itemCount: 7 },
      { code: "PH-02", progress: 100, startDate: "2026-06-08", dueDate: "2026-06-25", itemCount: 8 },
      { code: "PH-03", progress: 88, startDate: "2026-06-20", dueDate: "2026-07-20", itemCount: 10 },
      { code: "PH-04", progress: 80, startDate: "2026-07-10", dueDate: "2026-08-05", itemCount: 12 },
      { code: "PH-05", progress: 69, startDate: "2026-07-25", dueDate: "2026-08-31", itemCount: 14 },
      { code: "PH-06", progress: 45, startDate: "2026-08-17", dueDate: "2026-09-20", itemCount: 12 },
      { code: "PH-07", progress: 0, startDate: "2026-09-21", dueDate: "2026-09-30", itemCount: 10 },
      { code: "BPH-01", progress: 100, startDate: "2026-06-01", dueDate: "2026-06-20", itemCount: 7 },
      { code: "BPH-02", progress: 94, startDate: "2026-06-15", dueDate: "2026-07-24", itemCount: 5 },
      { code: "BPH-03", progress: 90, startDate: "2026-06-25", dueDate: "2026-08-07", itemCount: 8 },
      { code: "BPH-04", progress: 41, startDate: "2026-07-27", dueDate: "2026-08-31", itemCount: 5 },
      { code: "BPH-05", progress: 43, startDate: "2026-08-10", dueDate: "2026-09-03", itemCount: 3 },
      { code: "BPH-06", progress: 28, startDate: "2026-08-24", dueDate: "2026-09-18", itemCount: 2 },
      { code: "BPH-07", progress: 40, startDate: "2026-09-07", dueDate: "2026-09-30", itemCount: 5 },
    ]);
  });

  it("keeps every technical phase aligned with its work items and verification gate", () => {
    const technicalPhases = pmsMilestoneSeeds.filter(({ code }) =>
      code.startsWith("PH-"),
    );

    expect(technicalPhases.map(({ code }) => code)).toEqual([
      "PH-01",
      "PH-02",
      "PH-03",
      "PH-04",
      "PH-05",
      "PH-06",
      "PH-07",
    ]);

    for (const phase of technicalPhases) {
      const items = pmsWorkItemSeeds.filter(
        ({ milestoneCode }) => milestoneCode === phase.code,
      );
      expect(items.filter(({ code }) => code.endsWith(".GATE"))).toHaveLength(1);
      expect(items.at(-1)?.code).toBe(`${phase.code}.GATE`);
      expect(items.map(({ startDate }) => startDate).sort()[0]).toBe(
        phase.startDate,
      );
      expect(items.map(({ dueDate }) => dueDate).sort().at(-1)).toBe(
        phase.dueDate,
      );
      expect(
        Math.round(
          items.reduce((total, item) => total + item.progress, 0) /
            items.length,
        ),
      ).toBe(phase.progress);
    }
  });

  it("preserves every supplied Work Item exactly once", () => {
    expect(pmsWorkItemSeeds).toHaveLength(108);
    expect(new Set(pmsWorkItemSeeds.map(({ code }) => code)).size).toBe(108);
    expect(
      new Set(pmsWorkItemSeeds.map(({ milestoneCode }) => milestoneCode)),
    ).toEqual(new Set(pmsMilestoneSeeds.map(({ code }) => code)));
  });

  it("maps the supplied lifecycle stages to the five management stages", () => {
    const stageCounts = Object.groupBy(
      pmsWorkItemSeeds,
      ({ lifecycleStage }) => lifecycleStage,
    );
    expect(stageCounts.NS).toHaveLength(13);
    expect(stageCounts.IP).toHaveLength(41);
    expect(stageCounts.CHK).toHaveLength(22);
    expect(stageCounts.RPR).toHaveLength(17);
    expect(stageCounts.LIVE).toHaveLength(15);
  });

  it("keeps the supplied planning baseline free of invented shared rows", () => {
    expect(pmsSharedCapabilitySeeds).toEqual([]);
    expect(pmsPilotCapabilitySeeds).toEqual([]);
  });

  it("preserves workstream and planning validation rules", () => {
    expect(validatePmsSeedDefinitions).not.toThrow();
    for (const item of pmsWorkItemSeeds) {
      expect(item.supportingWorkstreams).not.toContain(item.primaryWorkstream);
      expect(item.progress).toBeGreaterThanOrEqual(0);
      expect(item.progress).toBeLessThanOrEqual(100);
      expect(item.startDate <= item.dueDate).toBe(true);
    }
  });

  it("provides stable project-scoped Risk and Decision examples", () => {
    expect(pmsRiskSeeds).toHaveLength(3);
    expect(pmsDecisionSeeds).toHaveLength(3);
    expect(new Set(pmsRiskSeeds.map(({ id }) => id)).size).toBe(
      pmsRiskSeeds.length,
    );
    expect(new Set(pmsDecisionSeeds.map(({ id }) => id)).size).toBe(
      pmsDecisionSeeds.length,
    );
  });

  it("preserves the controlled Pilot workspace without invented links", () => {
    expect(pmsPilotTeamSeeds.map(({ name }) => name)).toEqual([
      "Inbound",
      "Outbound",
      "Pre-Approvals IP Offshore",
    ]);
    expect(
      pmsPilotCriterionSeeds.filter(({ type }) => type === "ENTRY"),
    ).toHaveLength(3);
    expect(
      pmsPilotCriterionSeeds.filter(({ type }) => type === "EXIT"),
    ).toHaveLength(3);
    expect(pmsPilotCapabilitySeeds).toHaveLength(0);
  });
});
