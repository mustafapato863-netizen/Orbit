import { notFound } from "next/navigation";
import { CalendarDays, TriangleAlert } from "lucide-react";

import { DeliveryPipelineBoard } from "@/components/pipeline/delivery-pipeline-board";
import { PipelineSummary } from "@/components/pipeline/pipeline-summary";
import { ProjectTimelineAgenda } from "@/components/pipeline/project-timeline-agenda";
import { ProjectWorkstreamsSummary } from "@/components/workstreams/technical-workstreams-summary";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { buildDeliveryPipeline } from "@/lib/pipeline/pipeline";
import { pipelineQueries } from "@/lib/pipeline/pipeline.service";

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function DeliveryPipelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);

  const project = await pipelineQueries.getProjectPipeline(projectId);
  if (!project) notFound();

  const pipeline = buildDeliveryPipeline(project, new Date());

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 px-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#2f6fe4]">
            {project.code} / Dashboard
          </p>
          <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-[-0.025em] text-[var(--orbit-text)]">
            Timeline roadmap
          </h1>
          <p className="mt-1 text-[0.82rem] text-[var(--orbit-text-muted)]">
            Dates, status, ownership, and next delivery activity across the project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.atRiskCount ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f3c469] bg-[#fff8e8] px-3 text-[0.72rem] font-extrabold text-[#a85e05]">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              {pipeline.atRiskCount} at risk
            </span>
          ) : null}
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--orbit-border)] bg-white px-3 text-[0.72rem] font-semibold text-[var(--orbit-text-muted)] shadow-[var(--orbit-shadow-xs)]">
            <CalendarDays className="size-3.5 text-[var(--orbit-text-subtle)]" />
            Today
            <strong className="text-[var(--orbit-text)]">
              {dateLabel(pipeline.asOfDate)}
            </strong>
          </span>
        </div>
      </header>

      <PipelineSummary pipeline={pipeline} />
      <DeliveryPipelineBoard
        pipeline={pipeline}
        projectId={projectId}
        permissions={{
          userId: context.user.id,
          canManageMilestones: hasPermission(
            context.user,
            PERMISSIONS.MILESTONE_MANAGE,
          ),
          canManageWorkItems: hasPermission(
            context.user,
            PERMISSIONS.WORK_ITEM_MANAGE,
          ),
          canUpdateAssignedWorkItems: hasPermission(
            context.user,
            PERMISSIONS.WORK_ITEM_UPDATE_ASSIGNED,
          ),
          canManageCapabilities: hasPermission(
            context.user,
            PERMISSIONS.SHARED_CAPABILITY_MANAGE,
          ),
          canUpdateAssignedCapabilities: hasPermission(
            context.user,
            PERMISSIONS.SHARED_CAPABILITY_UPDATE_ASSIGNED,
          ),
        }}
      />
      <ProjectWorkstreamsSummary pipeline={pipeline} />
      <ProjectTimelineAgenda pipeline={pipeline} projectId={projectId} />
    </div>
  );
}
