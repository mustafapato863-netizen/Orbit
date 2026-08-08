import { notFound } from "next/navigation";

import { ArchiveButton } from "@/components/projects/archive-button";
import { MilestoneForm } from "@/components/projects/milestone-form";
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
import { dateInputValue } from "@/lib/projects/project.utils";

export default async function EditMilestonePage({
  params,
}: {
  params: Promise<{ projectId: string; milestoneId: string }>;
}) {
  const { projectId, milestoneId } = await params;
  await requirePagePermission(PERMISSIONS.MILESTONE_MANAGE, projectId);
  const [project, milestone, setup] = await Promise.all([
    projectQueries.getProject(projectId),
    projectQueries.getMilestone(projectId, milestoneId),
    executionQueries.getSetup(projectId),
  ]);
  if (!project || !milestone) notFound();
  const [, members] = setup;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} · ${milestone.code}`}
        title="Edit business milestone"
        description={milestone.name}
      />
      <Card>
        <CardHeader>
          <CardTitle>Milestone details</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneForm
            projectId={projectId}
            milestoneId={milestoneId}
            members={members}
            initialValues={{
              projectId,
              code: milestone.code,
              name: milestone.name,
              businessPurpose: milestone.businessPurpose ?? "",
              status: milestone.status as
                | "NOT_STARTED"
                | "IN_PROGRESS"
                | "AT_RISK"
                | "BLOCKED"
                | "COMPLETED",
              progress: milestone.progress,
              riskLevel: milestone.riskLevel,
              releaseHorizon: milestone.releaseHorizon,
              startDate: dateInputValue(milestone.startDate),
              dueDate: dateInputValue(milestone.dueDate),
              deliveredScope: milestone.deliveredScope ?? "",
              remainingScope: milestone.remainingScope ?? "",
              currentBlockers: milestone.currentBlockers ?? "",
              nextAction: milestone.nextAction ?? "",
              firstReleaseImpact: milestone.firstReleaseImpact ?? "",
            }}
          />
        </CardContent>
      </Card>
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle>Archive milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <ArchiveButton
            projectId={projectId}
            milestoneId={milestoneId}
            label={milestone.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
