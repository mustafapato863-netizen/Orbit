import { authorizationErrorResponse, requireSession } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await requireSession({ allowPasswordChange: true });

    return Response.json(
      {
        user: {
          id: context.user.id,
          email: context.user.email,
          displayName: context.user.displayName,
          roles: context.user.roleNames,
          mustChangePassword: context.user.mustChangePassword,
        },
        expiresAt: context.expiresAt.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return authorizationErrorResponse(error);
  }
}
