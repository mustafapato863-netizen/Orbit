import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use no more than 128 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  )
  .refine((value) => /[a-z]/.test(value), "Add a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Add an uppercase letter.")
  .refine((value) => /\d/.test(value), "Add a number.")
  .refine(
    (value) => /[^A-Za-z0-9]/.test(value),
    "Add a symbol or punctuation mark.",
  );

export const signInSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  password: z.string().min(1, "Enter your password.").max(128),
  nextPath: z
    .string()
    .max(500)
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        (value.startsWith("/") && !value.startsWith("//")),
      "The return path is invalid.",
    ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Choose a password different from your current password.",
    path: ["newPassword"],
  });

export const createUserSchema = z.object({
  displayName: z.string().trim().min(2).max(160),
  email: z.email().max(320),
  temporaryPassword: passwordSchema,
  roleId: z.uuid(),
  projectIds: z.array(z.uuid()).max(200),
  membershipRole: z.enum([
    "PROJECT_MANAGER",
    "TECHNICAL_LEAD",
    "REVIEWER",
    "VIEWER",
  ]),
});

export const assignRoleSchema = z.object({
  userId: z.uuid(),
  roleId: z.uuid(),
});

export const projectMembershipSchema = z.object({
  userId: z.uuid(),
  projectId: z.uuid(),
  membershipRole: z.enum([
    "PROJECT_MANAGER",
    "TECHNICAL_LEAD",
    "REVIEWER",
    "VIEWER",
  ]),
});

export const removeProjectMembershipSchema = z.object({
  userId: z.uuid(),
  projectId: z.uuid(),
});

export const setAccountStatusSchema = z.object({
  userId: z.uuid(),
  isActive: z.boolean(),
});

export const updateDisplayNameSchema = z.object({
  userId: z.uuid(),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(160, "Display name must be no more than 160 characters."),
});

export const resetPasswordSchema = z.object({
  userId: z.uuid(),
  temporaryPassword: passwordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type ProjectMembershipInput = z.infer<typeof projectMembershipSchema>;
export type RemoveProjectMembershipInput = z.infer<
  typeof removeProjectMembershipSchema
>;
export type SetAccountStatusInput = z.infer<typeof setAccountStatusSchema>;
export type UpdateDisplayNameInput = z.infer<typeof updateDisplayNameSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type ActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}
