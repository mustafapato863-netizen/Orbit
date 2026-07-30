export const PERMISSIONS = {
  SYSTEM_MANAGE: "system.manage",
  PROJECT_CREATE: "project.create",
  PROJECT_UPDATE: "project.update",
  PROJECT_VIEW: "project.view",
  PROJECT_MANAGE_MEMBERS: "project.manage_members",
  MILESTONE_MANAGE: "milestone.manage",
  WORK_ITEM_MANAGE: "work_item.manage",
  WORK_ITEM_UPDATE_ASSIGNED: "work_item.update_assigned",
  SHARED_CAPABILITY_MANAGE: "shared_capability.manage",
  SHARED_CAPABILITY_UPDATE_ASSIGNED:
    "shared_capability.update_assigned",
  DELIVERY_STAGE_UPDATE: "delivery_stage.update",
  RISK_MANAGE: "risk.manage",
  DECISION_MANAGE: "decision.manage",
  DECISION_REVIEW: "decision.review",
  PILOT_MANAGE: "pilot.manage",
  PILOT_REVIEW: "pilot.review",
  UAT_REVIEW: "uat.review",
  REPORT_EXPORT: "report.export",
  AUDIT_VIEW: "audit.view",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SYSTEM_MANAGE_PERMISSION = PERMISSIONS.SYSTEM_MANAGE;
