import { z } from "zod";

const postgresUrl = z
  .string()
  .trim()
  .min(1, "DATABASE_URL is required.")
  .url("DATABASE_URL must be a valid URL.")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL must use the PostgreSQL protocol.",
  );

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: postgresUrl,
  AUTH_SECRET: z.string().min(32).optional(),
  SEED_LOCAL_PASSWORD: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).optional(),
  ),
  APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .trim()
    .min(1)
    .default("Orbit Project Manager"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>,
): Readonly<ServerEnv> {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: input.NODE_ENV,
    DATABASE_URL: input.DATABASE_URL,
    AUTH_SECRET: input.AUTH_SECRET,
    SEED_LOCAL_PASSWORD: input.SEED_LOCAL_PASSWORD,
    APP_URL: input.APP_URL,
    NEXT_PUBLIC_APP_NAME: input.NEXT_PUBLIC_APP_NAME,
  });

  if (!result.success) {
    const invalidFields = [
      ...new Set(
        result.error.issues.map(
          (issue) => issue.path.join(".") || "environment",
        ),
      ),
    ];

    throw new Error(
      `Invalid server environment configuration. Check: ${invalidFields.join(", ")}.`,
    );
  }

  return Object.freeze(result.data);
}
