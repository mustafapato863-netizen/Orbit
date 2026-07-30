import { notFound, redirect } from "next/navigation";

import { AssignedExecutionForm } from "@/components/execution/assigned-execution-form";
import { CapabilityForm } from "@/components/execution/capability-form";
import { ExecutionArchiveButton } from "@/components/execution/execution-archive-button";
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

export default async function EditCapabilityPage({
  params,
}: {
  params: Promise<{ projectId: string; sharedCapabilityId: string }>;
}) {
  const { projectId, sharedCapabilityId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, capability, setup] = await Promise.all([
    projectQueries.getProject(projectId),
    executionQueries.getCapability(projectId, sharedCapabilityId),
    executionQueries.getSetup(projectId),
  ]);
  if (!project || !capability) notFound();
  const canManage = hasPermission(
    context.user,
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
  );
  const canUpdateAssigned =
    hasPermission(
      context.user,
      PERMISSIONS.SHARED_CAPABILITY_UPDATE_ASSIGNED,
    ) && capability.ownerId === context.user.id;
  if (!canManage && !canUpdateAssigned) redirect("/forbidden");
  const [workstreams, members, milestones] = setup;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} · ${capability.code}`}
        title={canManage ? "Edit Shared Capability" : "Update assigned capability"}
        description={capability.name}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {canManage ? "Canonical capability" : "Execution status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <CapabilityForm
              projectId={projectId}
              sharedCapabilityId={sharedCapabilityId}
              workstreams={workstreams}
              members={members}
              milestones={milestones}
              initialValues={{
                projectId,
                code: capability.code,
                name: capability.name,
                description: capability.description ?? "",
                primaryWorkstreamId: capability.primaryWorkstreamId,
                supportingWorkstreamIds: capability.supportingWorkstreams.map(
                  ({ workstreamId }) => workstreamId,
                ),
                status: capability.status as
                  | "NOT_STARTED"
                  | "IN_PROGRESS"
                  | "AT_RISK"
                  | "BLOCKED"
                  | "COMPLETED"
                  | "CANCELLED",
                progress: capability.progress,
                deliveryStage: capability.deliveryStage,
                nextGate: capability.nextGate ?? "",
                startDate: dateInputValue(capability.startDate),
                dueDate: dateInputValue(capability.dueDate),
                ownerId: capability.ownerId ?? "",
                riskLevel: capability.riskLevel,
                blocker: capability.blocker ?? "",
                notes: capability.notes ?? "",
                acceptanceCriteria: capability.acceptanceCriteria ?? "",
                milestoneLinks: capability.milestoneLinks.map((link) => ({
                  milestoneId: link.milestoneId,
                  sourceReference: link.sourceReference ?? "",
                  dependencyNotes: link.dependencyNotes ?? "",
                  isCritical: link.isCritical,
                })),
              }}
            />
          ) : (
            <AssignedExecutionForm
              entityId={capability.id}
              kind="capability"
              initialValues={{
                status: capability.status as
                  | "NOT_STARTED"
                  | "IN_PROGRESS"
                  | "AT_RISK"
                  | "BLOCKED"
                  | "COMPLETED"
                  | "CANCELLED",
                progress: capability.progress,
                deliveryStage: capability.deliveryStage,
                nextGate: capability.nextGate ?? "",
                riskLevel: capability.riskLevel,
                blocker: capability.blocker ?? "",
                notes: capability.notes ?? "",
              }}
            />
          )}
        </CardContent>
      </Card>
      {canManage ? (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle>Archive Shared Capability</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionArchiveButton
              projectId={projectId}
              sharedCapabilityId={sharedCapabilityId}
              label={capability.name}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
