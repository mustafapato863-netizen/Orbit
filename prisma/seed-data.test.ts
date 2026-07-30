import { describe, expect, it } from "vitest";

import {
  permissionSeeds,
  localAccountSeeds,
  roleSeeds,
  validateSeedDefinitions,
  workstreamSeeds,
} from "@/prisma/seed-data";

describe("reference seed definitions", () => {
  it("contain the three canonical workstreams exactly once", () => {
    expect(workstreamSeeds.map(({ code }) => code).sort()).toEqual([
      "BACKEND",
      "DATABASE",
      "FRONTEND",
    ]);
  });

  it("contain the five system roles exactly once", () => {
    expect(roleSeeds.map(({ name }) => name)).toEqual([
      "Administrator",
      "Project Manager",
      "Technical Lead",
      "Reviewer",
      "Viewer",
    ]);
  });

  it("only reference declared permissions without duplicates", () => {
    expect(validateSeedDefinitions).not.toThrow();
    expect(new Set(permissionSeeds.map(({ code }) => code)).size).toBe(
      permissionSeeds.length,
    );
  });

  it("defines one safe local account for each system role", () => {
    expect(localAccountSeeds.map(({ roleName }) => roleName)).toEqual(
      roleSeeds.map(({ name }) => name),
    );
    expect(localAccountSeeds.every(({ email }) => email.endsWith("@orbit.local"))).toBe(
      true,
    );
  });

  it("maps the minimum role permissions without granting Viewer mutations", () => {
    const byRole = new Map(
      roleSeeds.map((role) => [role.name, new Set(role.permissionCodes)]),
    );

    expect(byRole.get("Administrator")).toEqual(
      new Set(permissionSeeds.map(({ code }) => code)),
    );
    expect(byRole.get("Project Manager")).toEqual(
      new Set([
        "project.create",
        "project.update",
        "project.view",
        "project.manage_members",
        "milestone.manage",
        "work_item.manage",
        "shared_capability.manage",
        "delivery_stage.update",
        "risk.manage",
        "decision.manage",
        "pilot.manage",
        "report.export",
        "audit.view",
      ]),
    );
    expect(byRole.get("Technical Lead")).toEqual(
      new Set([
        "project.view",
        "work_item.update_assigned",
        "shared_capability.update_assigned",
        "delivery_stage.update",
      ]),
    );
    expect(byRole.get("Reviewer")).toEqual(
      new Set([
        "project.view",
        "decision.review",
        "pilot.review",
        "uat.review",
      ]),
    );
    expect(byRole.get("Viewer")).toEqual(new Set(["project.view"]));
  });
});
