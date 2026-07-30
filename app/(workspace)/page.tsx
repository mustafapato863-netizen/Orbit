import { redirect } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { projectQueries } from "@/lib/projects/project.service";

export default async function WorkspaceHome() {
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW);
  const projects = await projectQueries.listProjects(
    context.user.id,
    hasPermission(context.user, PERMISSIONS.SYSTEM_MANAGE),
  );

  if (projects.length === 1) {
    redirect(`/projects/${projects[0]!.id}`);
  }

  redirect("/projects");
}
