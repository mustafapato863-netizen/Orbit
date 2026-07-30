import "server-only";

import type { Prisma } from "@/generated/prisma/client";

type AuditDatabase = Pick<Prisma.TransactionClient, "auditLog">;
const SENSITIVE_AUDIT_KEY =
  /(authorization|cookie|credential|database.?url|password|secret|session|token)/i;
const REDACTED = "[REDACTED]";

export type AuditEntry = {
  actorId?: string | null;
  projectId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export function sanitizeAuditValue(
  value: Prisma.InputJsonValue,
): Prisma.InputJsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_AUDIT_KEY.test(key)
          ? REDACTED
          : sanitizeAuditValue(item as Prisma.InputJsonValue),
      ]),
    );
  }

  return value;
}

export function recordAuditEntry(
  database: AuditDatabase,
  {
    actorId = null,
    projectId = null,
    beforeState,
    afterState,
    metadata,
    ...entry
  }: AuditEntry,
) {
  return database.auditLog.create({
    data: {
      ...entry,
      actorId,
      projectId,
      ...(beforeState === undefined
        ? {}
        : { beforeState: sanitizeAuditValue(beforeState) }),
      ...(afterState === undefined
        ? {}
        : { afterState: sanitizeAuditValue(afterState) }),
      ...(metadata === undefined
        ? {}
        : { metadata: sanitizeAuditValue(metadata) }),
    },
  });
}
