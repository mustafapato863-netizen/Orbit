import { z } from "zod";

const optionalDate = z.string().trim().refine(
  (value) =>
    value === "" ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value),
  "Enter a valid date.",
);
const optionalId = z.union([z.uuid(), z.literal("")]);
const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const riskStatuses = ["OPEN", "MITIGATING", "ACCEPTED", "CLOSED"] as const;
export const riskTargetTypes = ["NONE", "WORK_ITEM", "SHARED_CAPABILITY"] as const;
export const decisionStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DEFERRED",
  "SUPERSEDED",
] as const;

const riskFields = {
  projectId: z.uuid(),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().min(2).max(10_000),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  milestoneId: optionalId,
  targetType: z.enum(riskTargetTypes),
  targetId: optionalId,
  primaryWorkstreamId: optionalId,
  ownerId: optionalId,
  mitigation: optionalText(10_000),
  dueDate: optionalDate,
  status: z.enum(riskStatuses),
};

function validateRiskTarget(
  value: { targetType: (typeof riskTargetTypes)[number]; targetId: string },
  context: z.RefinementCtx,
) {
  if (value.targetType === "NONE" && value.targetId) {
    context.addIssue({ code: "custom", path: ["targetId"], message: "Clear the technical target or select its type." });
  }
  if (value.targetType !== "NONE" && !value.targetId) {
    context.addIssue({ code: "custom", path: ["targetId"], message: "Select a related technical item." });
  }
}

export const createRiskSchema = z.object(riskFields).superRefine(validateRiskTarget);
export const updateRiskSchema = z
  .object({ ...riskFields, riskId: z.uuid() })
  .superRefine(validateRiskTarget);
export const riskIdSchema = z.object({ projectId: z.uuid(), riskId: z.uuid() });

const decisionFields = {
  projectId: z.uuid(),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().min(2).max(10_000),
  milestoneId: optionalId,
  affectedWorkstreamIds: z.array(z.uuid()).min(1).max(3),
  requiredBy: optionalDate,
  recommendedDirection: optionalText(10_000),
  ownerId: optionalId,
  status: z.enum(decisionStatuses),
  decisionText: optionalText(10_000),
};

function validateDecision(
  value: { affectedWorkstreamIds: string[]; status: string; decisionText: string },
  context: z.RefinementCtx,
) {
  if (new Set(value.affectedWorkstreamIds).size !== value.affectedWorkstreamIds.length) {
    context.addIssue({ code: "custom", path: ["affectedWorkstreamIds"], message: "Affected Workstreams must be unique." });
  }
  if (["APPROVED", "REJECTED"].includes(value.status) && value.decisionText.length < 2) {
    context.addIssue({ code: "custom", path: ["decisionText"], message: "Record the decision before closing the review." });
  }
}

export const createDecisionSchema = z.object(decisionFields).superRefine(validateDecision);
export const updateDecisionSchema = z
  .object({ ...decisionFields, decisionId: z.uuid() })
  .superRefine(validateDecision);
export const decisionIdSchema = z.object({ projectId: z.uuid(), decisionId: z.uuid() });
export const reviewDecisionSchema = z.object({
  projectId: z.uuid(),
  decisionId: z.uuid(),
  status: z.enum(["APPROVED", "REJECTED", "DEFERRED"]),
  decisionText: z.string().trim().min(2).max(10_000),
  comment: optionalText(10_000),
});
export const decisionCommentSchema = z.object({
  projectId: z.uuid(),
  decisionId: z.uuid(),
  body: z.string().trim().min(1).max(10_000),
});

export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type CreateDecisionInput = z.infer<typeof createDecisionSchema>;
export type UpdateDecisionInput = z.infer<typeof updateDecisionSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
export type DecisionCommentInput = z.infer<typeof decisionCommentSchema>;
