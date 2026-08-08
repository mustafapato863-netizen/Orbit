import { prisma } from "@/lib/prisma";
import type { Collaborator } from "@/components/pipeline/active-collaborators-bar";

export function formatInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleColor(roleName: string): string {
  const normalized = roleName.toUpperCase();
  if (normalized.includes("ADMIN")) return "bg-rose-600";
  if (normalized.includes("MANAGER") || normalized.includes("PM")) return "bg-blue-600";
  if (normalized.includes("LEAD") || normalized.includes("TECH")) return "bg-emerald-600";
  if (normalized.includes("REVIEWER")) return "bg-purple-600";
  return "bg-indigo-600";
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function getProjectActiveCollaborators(
  projectId: string,
): Promise<Collaborator[]> {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      archivedAt: null,
      user: { is: { isActive: true, archivedAt: null } },
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          lastLoginAt: true,
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            select: { lastSeenAt: true },
            orderBy: { lastSeenAt: "desc" },
            take: 1,
          },
          userRoles: {
            where: { role: { archivedAt: null } },
            select: { role: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { user: { displayName: "asc" } },
  });

  const now = Date.now();

  const collaborators: Collaborator[] = members.map((member) => {
    const { role, user } = member;
    const lastSeen = user.sessions[0]?.lastSeenAt;
    const isOnline = Boolean(
      lastSeen && now - lastSeen.getTime() <= FIVE_MINUTES_MS,
    );
    const systemRole = user.userRoles[0]?.role.name;
    const displayRole =
      role.replaceAll("_", " ").toLowerCase() === "viewer" && systemRole
        ? systemRole
        : role.replaceAll("_", " ");

    return {
      id: user.id,
      name: user.displayName,
      role: displayRole.charAt(0).toUpperCase() + displayRole.slice(1),
      initials: formatInitials(user.displayName),
      color: getRoleColor(systemRole || role),
      status: isOnline ? "editing" : "viewing",
      isOnline,
      lastSeenAt: lastSeen ?? user.lastLoginAt,
    };
  });

  return collaborators.sort((a, b) => {
    if (a.isOnline === b.isOnline) return 0;
    return a.isOnline ? -1 : 1;
  });
}
