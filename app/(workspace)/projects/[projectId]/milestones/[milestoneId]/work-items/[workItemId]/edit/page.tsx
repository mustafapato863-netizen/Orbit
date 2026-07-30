import { notFound, redirect } from "next/navigation";

import { AssignedExecutionForm } from "@/components/execution/assigned-execution-form";
import { ExecutionArchiveButton } from "@/components/execution/execution-archive-button";
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
import { hasPermission } from "@/lib/auth/policy";
import { executionQueries } from "@/lib/execution/execution.service";
import { projectQueries } from "@/lib/projects/project.service";
import { dateInputValue } from "@/lib/projects/project.utils";

export default async function EditWorkItemPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    milestoneId: string;
    workItemId: string;
  }>;
}) {
  const { projectId, milestoneId, workItemId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, milestone, item, setup] = await Promise.all([
    projectQueries.getProject(projectId),
    projectQueries.getMilestone(projectId, milestoneId),
    executionQueries.getWorkItem(projectId, milestoneId, workItemId),
    executionQueries.getSetup(projectId),
  ]);
  if (!project || !milestone || !item) notFound();

  const canManage = hasPermission(context.user, PERMISSIONS.WORK_ITEM_MANAGE);
  const canUpdateAssigned =
    hasPermission(context.user, PERMISSIONS.WORK_ITEM_UPDATE_ASSIGNED) &&
    item.ownerId === context.user.id;
  if (!canManage && !canUpdateAssigned) redirect("/forbidden");
  const [workstreams, members] = setup;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} · ${milestone.code} · ${item.code}`}
        title={canManage ? "Edit Work Item" : "Update assigned execution"}
        description={item.name}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {canManage ? "Work Item details" : "Execution status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <WorkItemForm
              projectId={projectId}
              milestoneId={milestoneId}
              workItemId={workItemId}
              workstreams={workstreams}
              members={members}
              initialValues={{
                projectId,
                milestoneId,
                code: item.code,
                name: item.name,
                description: item.description ?? "",
                primaryWorkstreamId: item.primaryWorkstreamId,
                supportingWorkstreamIds: item.supportingWorkstreams.map(
                  ({ workstreamId }) => workstreamId,
                ),
                status: item.status as
                  | "NOT_STARTED"
                  | "IN_PROGRESS"
                  | "AT_RISK"
                  | "BLOCKED"
                  | "COMPLETED"
                  | "CANCELLED",
                progress: item.progress,
                deliveryStage: item.deliveryStage,
                nextGate: item.nextGate ?? "",
                startDate: dateInputValue(item.startDate),
                dueDate: dateInputValue(item.dueDate),
                ownerId: item.ownerId ?? "",
                riskLevel: item.riskLevel,
                blocker: item.blocker ?? "",
                notes: item.notes ?? "",
                acceptanceCriteria: item.acceptanceCriteria ?? "",
              }}
            />
          ) : (
            <AssignedExecutionForm
              entityId={item.id}
              kind="work-item"
              initialValues={{
                status: item.status as
                  | "NOT_STARTED"
                  | "IN_PROGRESS"
                  | "AT_RISK"
                  | "BLOCKED"
                  | "COMPLETED"
                  | "CANCELLED",
                progress: item.progress,
                deliveryStage: item.deliveryStage,
                nextGate: item.nextGate ?? "",
                riskLevel: item.riskLevel,
                blocker: item.blocker ?? "",
                notes: item.notes ?? "",
              }}
            />
          )}
        </CardContent>
      </Card>
      {canManage ? (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>Archive Work Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionArchiveButton
              projectId={projectId}
              milestoneId={milestoneId}
              workItemId={workItemId}
              label={item.name}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
