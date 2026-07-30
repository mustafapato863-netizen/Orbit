import { notFound, redirect } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";

export default async function MilestonePage({
  params,
}: {
  params: Promise<{ projectId: string; milestoneId: string }>;
}) {
  const { projectId, milestoneId } = await params;
  await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);

  const milestone = await projectQueries.getMilestone(projectId, milestoneId);
  if (!milestone) notFound();

  redirect(`/projects/${projectId}/milestones#milestone-${milestoneId}`);
}
