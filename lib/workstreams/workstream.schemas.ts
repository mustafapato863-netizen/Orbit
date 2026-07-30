import { z } from "zod";

const color = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour.");

const fields = z.object({
  name: z.string().trim().min(2, "Enter a workstream name.").max(80),
  description: z.string().trim().max(500),
  colorToken: color,
  iconKey: z.string().trim().min(1).max(40),
  sortOrder: z.number().int().min(0).max(10_000),
});

export const createWorkstreamSchema = fields.extend({
  projectId: z.uuid(),
});

export const updateWorkstreamSchema = fields.extend({
  projectId: z.uuid(),
  workstreamId: z.uuid(),
});

export const archiveWorkstreamSchema = z.object({
  projectId: z.uuid(),
  workstreamId: z.uuid(),
});

export type CreateWorkstreamInput = z.infer<typeof createWorkstreamSchema>;
export type UpdateWorkstreamInput = z.infer<typeof updateWorkstreamSchema>;
