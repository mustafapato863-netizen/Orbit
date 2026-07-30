import { type Permission, type Role } from "../generated/prisma/client";
import { PERMISSIONS } from "../lib/auth/permissions";

type SeedPermission = Pick<Permission, "code" | "name" | "description">;
type SeedRole = Pick<Role, "name" | "description" | "isSystem"> & {
  permissionCodes: readonly string[];
};

export const workstreamSeeds = [
  {
    code: "FRONTEND",
    slug: "frontend",
    name: "Frontend",
    description: "User experience, browser behavior, and client delivery.",
    colorToken: "#2f73e8",
    iconKey: "monitor",
    sortOrder: 10,
  },
  {
    code: "BACKEND",
    slug: "backend",
    name: "Backend",
    description: "Server workflows, APIs, orchestration, and integrations.",
    colorToken: "#129b68",
    iconKey: "server",
    sortOrder: 20,
  },
  {
    code: "DATABASE",
    slug: "database",
    name: "Database",
    description: "Data models, migrations, integrity, and persistence.",
    colorToken: "#e8860b",
    iconKey: "database",
    sortOrder: 30,
  },
] as const;

export const permissionSeeds = [
  {
    code: PERMISSIONS.SYSTEM_MANAGE,
    name: "Manage system",
    description: "Manage system configuration, roles, and users.",
  },
  {
    code: PERMISSIONS.PROJECT_CREATE,
    name: "Create projects",
    description: "Create new projects.",
  },
  {
    code: PERMISSIONS.PROJECT_UPDATE,
    name: "Update projects",
    description: "Update project details and status.",
  },
  {
    code: PERMISSIONS.PROJECT_VIEW,
    name: "View projects",
    description: "View authorized projects and their delivery data.",
  },
  {
    code: PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    name: "Manage project members",
    description: "Add, update, archive, and restore project memberships.",
  },
  {
    code: PERMISSIONS.MILESTONE_MANAGE,
    name: "Manage milestones",
    description: "Create and update project milestones.",
  },
  {
    code: PERMISSIONS.WORK_ITEM_MANAGE,
    name: "Manage work items",
    description: "Create and update work items across an authorized project.",
  },
  {
    code: PERMISSIONS.WORK_ITEM_UPDATE_ASSIGNED,
    name: "Update assigned work",
    description: "Update technical work assigned to the current user.",
  },
  {
    code: PERMISSIONS.SHARED_CAPABILITY_MANAGE,
    name: "Manage shared capabilities",
    description:
      "Create and manage canonical shared capabilities and milestone links.",
  },
  {
    code: PERMISSIONS.SHARED_CAPABILITY_UPDATE_ASSIGNED,
    name: "Update assigned shared capabilities",
    description:
      "Update technical execution for shared capabilities assigned to the current user.",
  },
  {
    code: PERMISSIONS.DELIVERY_STAGE_UPDATE,
    name: "Update delivery stages",
    description: "Update delivery stages within an authorized project.",
  },
  {
    code: PERMISSIONS.RISK_MANAGE,
    name: "Manage risks",
    description: "Create and update project risks and mitigations.",
  },
  {
    code: PERMISSIONS.DECISION_MANAGE,
    name: "Manage decisions",
    description: "Create and update project decisions.",
  },
  {
    code: PERMISSIONS.DECISION_REVIEW,
    name: "Review decisions",
    description: "Record, approve, reject, or defer decisions.",
  },
  {
    code: PERMISSIONS.PILOT_MANAGE,
    name: "Manage pilot workspace",
    description: "Configure pilot scope, teams, capabilities, criteria, and issues.",
  },
  {
    code: PERMISSIONS.PILOT_REVIEW,
    name: "Review pilot readiness",
    description: "Review pilot criteria and sign-off status.",
  },
  {
    code: PERMISSIONS.UAT_REVIEW,
    name: "Review UAT readiness",
    description: "Review and approve business UAT criteria.",
  },
  {
    code: PERMISSIONS.REPORT_EXPORT,
    name: "Export reports",
    description: "Generate management report exports.",
  },
  {
    code: PERMISSIONS.AUDIT_VIEW,
    name: "View audit history",
    description: "View authorized audit entries.",
  },
] as const satisfies readonly SeedPermission[];

export const retiredPermissionCodes = ["work_item.update"] as const;

const allPermissionCodes = permissionSeeds.map(({ code }) => code);

export const roleSeeds = [
  {
    name: "Administrator",
    description: "Full system access.",
    isSystem: true,
    permissionCodes: allPermissionCodes,
  },
  {
    name: "Project Manager",
    description: "Owns project delivery, governance, membership, and exports.",
    isSystem: true,
    permissionCodes: [
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
    ],
  },
  {
    name: "Technical Lead",
    description: "Updates assigned technical delivery and risks.",
    isSystem: true,
    permissionCodes: [
      "project.view",
      "work_item.update_assigned",
      "shared_capability.update_assigned",
      "delivery_stage.update",
    ],
  },
  {
    name: "Reviewer",
    description: "Reviews decisions and pilot readiness.",
    isSystem: true,
    permissionCodes: [
      "project.view",
      "decision.review",
      "pilot.review",
      "uat.review",
    ],
  },
  {
    name: "Viewer",
    description: "Read-only project access.",
    isSystem: true,
    permissionCodes: ["project.view"],
  },
] as const satisfies readonly SeedRole[];

export const localAccountSeeds = [
  {
    email: "admin@orbit.local",
    displayName: "Local Administrator",
    roleName: "Administrator",
  },
  {
    email: "manager@orbit.local",
    displayName: "Local Project Manager",
    roleName: "Project Manager",
  },
  {
    email: "lead@orbit.local",
    displayName: "Local Technical Lead",
    roleName: "Technical Lead",
  },
  {
    email: "reviewer@orbit.local",
    displayName: "Local Reviewer",
    roleName: "Reviewer",
  },
  {
    email: "viewer@orbit.local",
    displayName: "Local Viewer",
    roleName: "Viewer",
  },
] as const;

export function validateSeedDefinitions() {
  const workstreamCodes = workstreamSeeds.map(({ code }) => code);
  const permissionCodes = permissionSeeds.map(({ code }) => code);
  const roleNames = roleSeeds.map(({ name }) => name);
  const localEmails = localAccountSeeds.map(({ email }) => email);

  if (new Set(workstreamCodes).size !== workstreamCodes.length) {
    throw new Error("Seed definitions contain duplicate workstream codes.");
  }

  if (new Set(permissionCodes).size !== permissionCodes.length) {
    throw new Error("Seed definitions contain duplicate permission codes.");
  }

  if (new Set(roleNames).size !== roleNames.length) {
    throw new Error("Seed definitions contain duplicate role names.");
  }

  if (new Set(localEmails).size !== localEmails.length) {
    throw new Error("Seed definitions contain duplicate local account emails.");
  }

  const knownRoles = new Set(roleNames);
  for (const account of localAccountSeeds) {
    if (!knownRoles.has(account.roleName)) {
      throw new Error(
        `Local account "${account.email}" references an unknown role.`,
      );
    }
  }

  const knownPermissions = new Set(permissionCodes);

  for (const role of roleSeeds) {
    if (new Set(role.permissionCodes).size !== role.permissionCodes.length) {
      throw new Error(`Seed role "${role.name}" repeats a permission.`);
    }

    for (const permissionCode of role.permissionCodes) {
      if (!knownPermissions.has(permissionCode)) {
        throw new Error(
          `Seed role "${role.name}" references an unknown permission.`,
        );
      }
    }
  }
}
