import {
  authorizationErrorResponse,
  requirePermission,
} from "@/lib/auth/authorization";
import { getAccessOverview } from "@/lib/auth/access.service";
import { SYSTEM_MANAGE_PERMISSION } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission(SYSTEM_MANAGE_PERMISSION);
    const { users } = await getAccessOverview();

    return Response.json(
      {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
          roles: user.userRoles.map(({ role }) => role.name),
          memberships: user.projectMemberships.map(({ project, role }) => ({
            projectId: project.id,
            projectName: project.name,
            role,
          })),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
