import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MilestoneList } from "@/components/projects/milestone-list";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { projectQueries } from "@/lib/projects/project.service";

export default async function MilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(
    PERMISSIONS.PROJECT_VIEW,
    projectId,
  );
  const project = await projectQueries.getProjectDetails(projectId);
  if (!project) notFound();

  const canManage = hasPermission(context.user, PERMISSIONS.MILESTONE_MANAGE);
  const canManageWorkItems = hasPermission(
    context.user,
    PERMISSIONS.WORK_ITEM_MANAGE,
  );
  const canUpdateAssignedWork = hasPermission(
    context.user,
    PERMISSIONS.WORK_ITEM_UPDATE_ASSIGNED,
  );
  const canManageCapabilities = hasPermission(
    context.user,
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
  );
  const canUpdateAssignedCapabilities = hasPermission(
    context.user,
    PERMISSIONS.SHARED_CAPABILITY_UPDATE_ASSIGNED,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${project.code} / Milestones`}
        title="Milestones"
        description="Define the major outcomes, dates, delivery work, and shared dependencies for this project."
        actions={
          canManage ? (
            <Button asChild>
              <Link href={`/projects/${projectId}/milestones/new`}>
                <Plus />
                Add milestone
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section aria-labelledby="milestone-list-heading">
        <h2 id="milestone-list-heading" className="sr-only">
          Project milestones
        </h2>
        <MilestoneList
          projectId={projectId}
          milestones={project.milestones}
          canManage={canManage}
          canManageWorkItems={canManageWorkItems}
          canUpdateAssignedWork={canUpdateAssignedWork}
          canManageCapabilities={canManageCapabilities}
          canUpdateAssignedCapabilities={canUpdateAssignedCapabilities}
          currentUserId={context.user.id}
        />
      </section>
    </div>
  );
}
