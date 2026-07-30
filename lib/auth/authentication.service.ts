import "server-only";

import { createHash } from "node:crypto";

import { recordAuditEntry } from "@/lib/audit/audit.service";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionData, type SessionContext } from "@/lib/auth/session";
import { normalizeEmail, type ChangePasswordInput } from "@/lib/auth/auth.schemas";
import { prisma } from "@/lib/prisma";

const SIGN_IN_WINDOW_MS = 15 * 60 * 1_000;
const MAX_FAILED_ATTEMPTS = 5;
const DUMMY_PASSWORD_HASH =
  "$2b$12$fUOyo0OR7WTB6rkDqfmyKuSRAKnxttLllRMyjwxuqkM9zCeppfKNm";

export class SignInError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "TOO_MANY_ATTEMPTS",
  ) {
    super(code);
    this.name = "SignInError";
  }
}

function identityFingerprint(normalizedEmail: string) {
  return createHash("sha256").update(normalizedEmail).digest("hex");
}

async function recordSignInEvent(
  action: string,
  fingerprint: string,
  actorId?: string,
) {
  await recordAuditEntry(prisma, {
    actorId,
    action,
    entityType: "AuthenticationIdentity",
    entityId: fingerprint,
  });
}

async function isSignInThrottled(fingerprint: string) {
  const windowStart = new Date(Date.now() - SIGN_IN_WINDOW_MS);
  const lastSuccess = await prisma.auditLog.findFirst({
    where: {
      action: "auth.sign_in_succeeded",
      entityType: "AuthenticationIdentity",
      entityId: fingerprint,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const failedAttempts = await prisma.auditLog.count({
    where: {
      action: "auth.sign_in_failed",
      entityType: "AuthenticationIdentity",
      entityId: fingerprint,
      createdAt: { gte: lastSuccess?.createdAt ?? windowStart },
    },
  });

  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const fingerprint = identityFingerprint(normalizedEmail);

  if (await isSignInThrottled(fingerprint)) {
    await recordSignInEvent("auth.sign_in_throttled", fingerprint);
    throw new SignInError("TOO_MANY_ATTEMPTS");
  }

  const user = await prisma.user.findUnique({
    where: { normalizedEmail },
    select: {
      id: true,
      passwordHash: true,
      mustChangePassword: true,
      isActive: true,
      archivedAt: true,
    },
  });

  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (
    !user ||
    !user.passwordHash ||
    !passwordMatches ||
    !user.isActive ||
    user.archivedAt
  ) {
    await recordSignInEvent("auth.sign_in_failed", fingerprint);
    throw new SignInError("INVALID_CREDENTIALS");
  }

  const session = createSessionData(user.id);

  await prisma.$transaction(async (transaction) => {
    await transaction.session.create({ data: session.database });
    await transaction.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await recordAuditEntry(transaction, {
      actorId: user.id,
      action: "auth.sign_in_succeeded",
      entityType: "AuthenticationIdentity",
      entityId: fingerprint,
    });
  });

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function signOutSession(context: SessionContext) {
  await prisma.$transaction(async (transaction) => {
    await transaction.session.updateMany({
      where: { id: context.sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await recordAuditEntry(transaction, {
      actorId: context.user.id,
      action: "auth.sign_out",
      entityType: "Session",
      entityId: context.sessionId,
    });
  });
}

export async function changeUserPassword(
  context: SessionContext,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { passwordHash: true, isActive: true, archivedAt: true },
  });

  if (
    !user?.passwordHash ||
    !user.isActive ||
    user.archivedAt ||
    !(await verifyPassword(input.currentPassword, user.passwordHash))
  ) {
    return false;
  }

  const passwordHash = await hashPassword(input.newPassword);
  const changedAt = new Date();

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: context.user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: changedAt,
      },
    });
    await transaction.session.updateMany({
      where: {
        userId: context.user.id,
        id: { not: context.sessionId },
        revokedAt: null,
      },
      data: { revokedAt: changedAt },
    });
    await recordAuditEntry(transaction, {
      actorId: context.user.id,
      action: "auth.password_changed",
      entityType: "User",
      entityId: context.user.id,
      beforeState: { mustChangePassword: context.user.mustChangePassword },
      afterState: { mustChangePassword: false },
    });
  });

  return true;
}
