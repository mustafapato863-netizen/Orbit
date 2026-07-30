import { notFound } from "next/navigation";

import { WorkItemForm } from "@/components/execution/work-item-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { executionQueries } from "@/lib/execution/execution.service";
import { projectQueries } from "@/lib/projects/project.service";

export default async function NewWorkItemPage({
  params,
}: {
  params: Promise<{ projectId: string; milestoneId: string }>;
}) {
  const { projectId, milestoneId } = await params;
  await requirePagePermission(PERMISSIONS.WORK_ITEM_MANAGE, projectId);
  const [project, milestone, setup] = await Promise.all([
    projectQueries.getProject(projectId),
    projectQueries.getMilestone(projectId, milestoneId),
    executionQueries.getSetup(projectId),
  ]);
  if (!project || !milestone) notFound();
  const [workstreams, members] = setup;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} · ${milestone.code}`}
        title="Create Milestone-Specific Work Item"
        description={`Add delivery work owned by ${milestone.name}.`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Work Item details</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkItemForm
            projectId={projectId}
            milestoneId={milestoneId}
            workstreams={workstreams}
            members={members}
          />
        </CardContent>
      </Card>
    </div>
  );
}
