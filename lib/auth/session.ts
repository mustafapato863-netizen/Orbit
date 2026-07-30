import "server-only";

import { cookies } from "next/headers";

import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session-token";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1_000;

export const SESSION_COOKIE_NAME =
  env.NODE_ENV === "production" ? "__Host-orbit_session" : "orbit_session";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  mustChangePassword: boolean;
  roleNames: string[];
  permissions: string[];
  projectMemberships: Array<{
    projectId: string;
    role: string;
    isPrivate?: boolean;
  }>;
};

export type SessionContext = {
  sessionId: string;
  expiresAt: Date;
  user: SessionUser;
};

const activeSessionInclude = {
  user: {
    include: {
      userRoles: {
        where: { role: { archivedAt: null } },
        include: {
          role: {
            include: {
              permissions: {
                where: { permission: { archivedAt: null } },
                include: { permission: true },
              },
            },
          },
        },
      },
      projectMemberships: {
        where: { archivedAt: null },
        select: {
          projectId: true,
          role: true,
          project: { select: { isPrivate: true } },
        },
      },
    },
  },
} satisfies Prisma.SessionInclude;

function toSessionContext(
  session: Prisma.SessionGetPayload<{ include: typeof activeSessionInclude }>,
): SessionContext {
  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      mustChangePassword: session.user.mustChangePassword,
      roleNames: session.user.userRoles.map(({ role }) => role.name),
      permissions: [
        ...new Set(
          session.user.userRoles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.code),
          ),
        ),
      ],
      projectMemberships: session.user.projectMemberships.map((membership) => ({
        projectId: membership.projectId,
        role: membership.role,
        isPrivate: membership.project.isPrivate,
      })),
    },
  };
}

export async function getSessionByToken(
  token: string | undefined,
): Promise<SessionContext | null> {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { is: { isActive: true, archivedAt: null } },
    },
    include: activeSessionInclude,
  });

  return session ? toSessionContext(session) : null;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return getSessionByToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function createSessionData(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return {
    token,
    expiresAt,
    database: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
