import { z } from "zod";

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
const optionalOwner = z.union([z.uuid(), z.literal("")]);

function validateInProgressProgress<
  T extends { status: string; progress: number },
>(value: T, context: z.RefinementCtx) {
  if (value.status === "IN_PROGRESS" && value.progress <= 10) {
    context.addIssue({
      code: "custom",
      message: "In Progress items must use a progress value above 10%.",
      path: ["progress"],
    });
  }
}

export const workItemStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "AT_RISK",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const deliveryStages = [
  "NOT_STARTED",
  "IN_DEVELOPMENT",
  "TECHNICAL_VERIFICATION",
  "BUSINESS_UAT",
  "STAGING",
  "CONTROLLED_PILOT",
  "PRODUCTION",
] as const;
export const executionRiskLevels = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

const executionFields = {
  code: z.string().trim().max(40).optional(),
  name: z.string().trim().min(2).max(240),
  description: optionalText(10_000),
  primaryWorkstreamId: z.uuid(),
  supportingWorkstreamIds: z.array(z.uuid()).max(2),
  status: z.enum(workItemStatuses),
  progress: z.number().int().min(0).max(100),
  deliveryStage: z.enum(deliveryStages),
  nextGate: optionalText(240),
  startDate: optionalDate,
  dueDate: optionalDate,
  ownerId: optionalOwner,
  riskLevel: z.enum(executionRiskLevels),
  blocker: optionalText(10_000),
  notes: optionalText(10_000),
  acceptanceCriteria: optionalText(20_000),
};

function validateExecutionRelations<
  T extends {
    primaryWorkstreamId: string;
    supportingWorkstreamIds: string[];
    startDate: string;
    dueDate: string;
  },
>(value: T, context: z.RefinementCtx) {
  if (
    new Set(value.supportingWorkstreamIds).size !==
    value.supportingWorkstreamIds.length
  ) {
    context.addIssue({
      code: "custom",
      message: "Supporting workstreams must be unique.",
      path: ["supportingWorkstreamIds"],
    });
  }
  if (value.supportingWorkstreamIds.includes(value.primaryWorkstreamId)) {
    context.addIssue({
      code: "custom",
      message: "The Primary Workstream cannot also be Supporting.",
      path: ["supportingWorkstreamIds"],
    });
  }
  if (
    value.startDate &&
    value.dueDate &&
    value.startDate.localeCompare(value.dueDate) > 0
  ) {
    context.addIssue({
      code: "custom",
      message: "The due date must be on or after the start date.",
      path: ["dueDate"],
    });
  }
}

export const createWorkItemSchema = z
  .object({
    projectId: z.uuid(),
    milestoneId: z.uuid(),
    ...executionFields,
  })
  .superRefine(validateExecutionRelations)
  .superRefine(validateInProgressProgress);

export const updateWorkItemSchema = z
  .object({
    projectId: z.uuid(),
    milestoneId: z.uuid(),
    workItemId: z.uuid(),
    ...executionFields,
  })
  .superRefine(validateExecutionRelations)
  .superRefine(validateInProgressProgress);

export const workItemIdSchema = z.object({
  projectId: z.uuid(),
  milestoneId: z.uuid(),
  workItemId: z.uuid(),
});

const assignedExecutionBaseSchema = z.object({
  workItemId: z.uuid(),
  status: z.enum(workItemStatuses),
  progress: z.number().int().min(0).max(100),
  deliveryStage: z.enum(deliveryStages),
  nextGate: optionalText(240),
  riskLevel: z.enum(executionRiskLevels),
  blocker: optionalText(10_000),
  notes: optionalText(10_000),
});

export const assignedExecutionSchema =
  assignedExecutionBaseSchema.superRefine(validateInProgressProgress);

const milestoneLinkSchema = z.object({
  milestoneId: z.uuid(),
  sourceReference: optionalText(500),
  dependencyNotes: optionalText(10_000),
  isCritical: z.boolean(),
});

const capabilityFields = {
  ...executionFields,
  milestoneLinks: z.array(milestoneLinkSchema).min(1).max(100),
};

function validateCapability(
  value: z.infer<z.ZodObject<typeof capabilityFields>>,
  context: z.RefinementCtx,
) {
  validateExecutionRelations(value, context);
  const ids = value.milestoneLinks.map(({ milestoneId }) => milestoneId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      message: "A milestone can be linked only once.",
      path: ["milestoneLinks"],
    });
  }
}

export const createSharedCapabilitySchema = z
  .object({
    projectId: z.uuid(),
    ...capabilityFields,
  })
  .superRefine(validateCapability)
  .superRefine(validateInProgressProgress);

export const updateSharedCapabilitySchema = z
  .object({
    projectId: z.uuid(),
    sharedCapabilityId: z.uuid(),
    ...capabilityFields,
  })
  .superRefine(validateCapability)
  .superRefine(validateInProgressProgress);

export const sharedCapabilityIdSchema = z.object({
  projectId: z.uuid(),
  sharedCapabilityId: z.uuid(),
});

export const assignedCapabilityExecutionSchema = assignedExecutionBaseSchema
  .omit({ workItemId: true })
  .extend({ sharedCapabilityId: z.uuid() })
  .superRefine(validateInProgressProgress);

export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
export type UpdateWorkItemInput = z.infer<typeof updateWorkItemSchema>;
export type AssignedExecutionInput = z.infer<typeof assignedExecutionSchema>;
export type CreateSharedCapabilityInput = z.infer<
  typeof createSharedCapabilitySchema
>;
export type UpdateSharedCapabilityInput = z.infer<
  typeof updateSharedCapabilitySchema
>;
export type AssignedCapabilityExecutionInput = z.infer<
  typeof assignedCapabilityExecutionSchema
>;
