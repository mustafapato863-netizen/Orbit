import { z } from "zod";

const colorToken = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour.");

const projectIds = z
  .array(z.uuid())
  .max(500, "A group can contain up to 500 projects.")
  .default([]);

const fields = z.object({
  name: z.string().trim().min(2, "Enter a group name.").max(160),
  description: z.string().trim().max(2_000),
  colorToken,
  sortOrder: z.number().int().min(0).max(10_000),
  projectIds,
});

export const createProjectGroupSchema = fields;

export const updateProjectGroupSchema = fields.extend({
  groupId: z.uuid(),
});

export const archiveProjectGroupSchema = z.object({
  groupId: z.uuid(),
});

export type CreateProjectGroupInput = z.infer<typeof createProjectGroupSchema>;
export type UpdateProjectGroupInput = z.infer<typeof updateProjectGroupSchema>;
export type ArchiveProjectGroupInput = z.infer<typeof archiveProjectGroupSchema>;

export type ProjectGroupActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

