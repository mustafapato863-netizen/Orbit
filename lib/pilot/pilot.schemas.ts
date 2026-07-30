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

export const pilotCriterionTypes = ["ENTRY", "EXIT"] as const;
export const pilotCriterionStatuses = ["MET", "NOT_MET", "WAIVED"] as const;
export const pilotCapabilityDispositions = ["INCLUDED", "DEFERRED"] as const;
export const pilotIssueStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
export const pilotRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const pilotScopeSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(2).max(200),
  knownLimitations: optionalText(20_000),
  supportOwnerId: optionalId,
  rollbackOwnerId: optionalId,
});

const teamFields = {
  projectId: z.uuid(),
  name: z.string().trim().min(2).max(160),
  description: optionalText(10_000),
  leadUserId: optionalId,
  memberIds: z.array(z.uuid()).max(100),
};
function uniqueMembers(value: { memberIds: string[] }, context: z.RefinementCtx) {
  if (new Set(value.memberIds).size !== value.memberIds.length) {
    context.addIssue({ code: "custom", path: ["memberIds"], message: "Pilot users must be unique." });
  }
}
export const createPilotTeamSchema = z.object(teamFields).superRefine(uniqueMembers);
export const updatePilotTeamSchema = z
  .object({ ...teamFields, teamId: z.uuid() })
  .superRefine(uniqueMembers);
export const pilotTeamIdSchema = z.object({ projectId: z.uuid(), teamId: z.uuid() });

export const pilotCapabilitySchema = z.object({
  projectId: z.uuid(),
  sharedCapabilityId: z.uuid(),
  disposition: z.enum(pilotCapabilityDispositions),
  notes: optionalText(10_000),
});

const criterionFields = {
  projectId: z.uuid(),
  code: z.string().trim().min(2).max(40).regex(/^[A-Z0-9][A-Z0-9_-]*$/, "Use uppercase letters, numbers, hyphens, or underscores."),
  type: z.enum(pilotCriterionTypes),
  title: z.string().trim().min(2).max(240),
  description: optionalText(10_000),
  isRequired: z.boolean(),
};
export const createPilotCriterionSchema = z.object(criterionFields);
export const updatePilotCriterionSchema = z.object({ ...criterionFields, criterionId: z.uuid() });
export const reviewPilotCriterionSchema = z.object({
  projectId: z.uuid(),
  criterionId: z.uuid(),
  status: z.enum(pilotCriterionStatuses),
  evidence: z.string().trim().min(2).max(20_000),
});

const issueFields = {
  projectId: z.uuid(),
  title: z.string().trim().min(2).max(240),
  description: optionalText(10_000),
  severity: z.enum(pilotRiskLevels),
  status: z.enum(pilotIssueStatuses),
  isBlocking: z.boolean(),
  ownerId: optionalId,
  mitigation: optionalText(10_000),
  dueDate: optionalDate,
};
export const createPilotIssueSchema = z.object(issueFields);
export const updatePilotIssueSchema = z.object({ ...issueFields, issueId: z.uuid() });
export const pilotIssueIdSchema = z.object({ projectId: z.uuid(), issueId: z.uuid() });

export const pilotSignOffSchema = z.object({
  projectId: z.uuid(),
  signOff: z.enum(["BUSINESS", "TECHNICAL"]),
  outcome: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().min(2).max(10_000),
});
export const finalPilotDecisionSchema = z.object({
  projectId: z.uuid(),
  status: z.enum(["APPROVED", "REJECTED", "DEFERRED"]),
  finalDecision: z.string().trim().min(2).max(20_000),
});

export type PilotScopeInput = z.infer<typeof pilotScopeSchema>;
export type CreatePilotTeamInput = z.infer<typeof createPilotTeamSchema>;
export type UpdatePilotTeamInput = z.infer<typeof updatePilotTeamSchema>;
export type PilotCapabilityInput = z.infer<typeof pilotCapabilitySchema>;
export type CreatePilotCriterionInput = z.infer<typeof createPilotCriterionSchema>;
export type UpdatePilotCriterionInput = z.infer<typeof updatePilotCriterionSchema>;
export type ReviewPilotCriterionInput = z.infer<typeof reviewPilotCriterionSchema>;
export type CreatePilotIssueInput = z.infer<typeof createPilotIssueSchema>;
export type UpdatePilotIssueInput = z.infer<typeof updatePilotIssueSchema>;
export type PilotSignOffInput = z.infer<typeof pilotSignOffSchema>;
export type FinalPilotDecisionInput = z.infer<typeof finalPilotDecisionSchema>;
