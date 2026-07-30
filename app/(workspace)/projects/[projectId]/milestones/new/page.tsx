import { notFound } from "next/navigation";

import { MilestoneBuilder } from "@/components/projects/milestone-builder";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";

export default async function NewMilestonePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.MILESTONE_MANAGE, projectId);
  const project = await projectQueries.getProject(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.code}
        title="Build milestone plan"
        description={`Create a milestone and its sub-milestones for ${project.name}.`}
      />
      <MilestoneBuilder projectId={project.id} />
    </div>
  );
}
