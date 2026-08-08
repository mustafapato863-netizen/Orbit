import { z } from "zod";
import { projectTypes } from "@/lib/workstreams/workstream-templates";

const optionalDate = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
        new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) ===
          value),
    "Enter a valid date.",
  );

const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const projectStatuses = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "AT_RISK",
  "COMPLETED",
] as const;

export const milestoneStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "AT_RISK",
  "BLOCKED",
  "COMPLETED",
] as const;

export const riskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const releaseHorizons = ["RELEASE_1", "PHASE_2"] as const;
export const membershipRoles = [
  "PROJECT_MANAGER",
  "TECHNICAL_LEAD",
  "REVIEWER",
  "VIEWER",
] as const;

const projectFields = z
  .object({
    code: z.string().trim().max(40).optional(),
    name: z.string().trim().min(2, "Enter a project name.").max(200),
    description: optionalText(5_000),
    status: z.enum(projectStatuses),
    progress: z.number().int().min(0).max(100),
    isPrivate: z.boolean(),
    projectType: z.enum(projectTypes).optional(),
    startDate: optionalDate,
    targetDate: optionalDate,
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.targetDate ||
      value.startDate.localeCompare(value.targetDate) <= 0,
    {
      message: "The target date must be on or after the start date.",
      path: ["targetDate"],
    },
  );

export const createProjectSchema = projectFields.extend({
  setupTemplate: z.enum(projectTypes).optional(),
});

export const updateProjectSchema = projectFields.and(
  z.object({ projectId: z.uuid() }),
);

export const projectIdSchema = z.object({ projectId: z.uuid() });

const milestoneFields = z
  .object({
    code: z.string().trim().max(40).optional(),
    name: z.string().trim().min(2, "Enter a milestone name.").max(200),
    businessPurpose: optionalText(10_000),
    status: z.enum(milestoneStatuses),
    progress: z.number().int().min(0).max(100),
    riskLevel: z.enum(riskLevels),
    releaseHorizon: z.enum(releaseHorizons),
    ownerId: z.string().uuid().optional().or(z.literal("")),
    startDate: optionalDate,
    dueDate: optionalDate,
    deliveredScope: optionalText(10_000),
    remainingScope: optionalText(10_000),
    currentBlockers: optionalText(10_000),
    nextAction: optionalText(10_000),
    firstReleaseImpact: optionalText(10_000),
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.dueDate ||
      value.startDate.localeCompare(value.dueDate) <= 0,
    {
      message: "The due date must be on or after the start date.",
      path: ["dueDate"],
    },
  );

export const createMilestoneSchema = milestoneFields.and(
  z.object({ projectId: z.uuid() }),
);

const subMilestoneBuilderSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a sub-milestone name.").max(240),
    startDate: optionalDate,
    dueDate: optionalDate,
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.dueDate ||
      value.startDate.localeCompare(value.dueDate) <= 0,
    {
      message: "The due date must be on or after the start date.",
      path: ["dueDate"],
    },
  );

export const createMilestonePlanSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(2, "Enter a milestone name.").max(200),
  subMilestones: z
    .array(subMilestoneBuilderSchema)
    .min(1, "Add at least one sub-milestone.")
    .max(100),
});

export const updateMilestoneSchema = milestoneFields.and(
  z.object({
    projectId: z.uuid(),
    milestoneId: z.uuid(),
  }),
);

export const milestoneIdSchema = z.object({
  projectId: z.uuid(),
  milestoneId: z.uuid(),
});

export const reorderMilestoneSchema = milestoneIdSchema.extend({
  direction: z.enum(["UP", "DOWN"]),
});

export const setMembershipSchema = z.object({
  projectId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(membershipRoles),
});

export const archiveMembershipSchema = z.object({
  projectId: z.uuid(),
  userId: z.uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateMilestonePlanInput = z.infer<
  typeof createMilestonePlanSchema
>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type ReorderMilestoneInput = z.infer<typeof reorderMilestoneSchema>;
export type SetMembershipInput = z.infer<typeof setMembershipSchema>;

export type ProjectActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  redirectTo?: string;
};
