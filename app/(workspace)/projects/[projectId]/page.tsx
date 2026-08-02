import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Pencil,
  Route,
  TriangleAlert,
} from "lucide-react";

import { ProjectExecutiveSnapshot } from "@/components/projects/project-executive-snapshot";
import { ProjectOverviewFocus } from "@/components/projects/project-overview-focus";
import { PhaseSummaryTable } from "@/components/projects/phase-summary-table";
import { Button } from "@/components/ui/button";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { buildDeliveryPipeline } from "@/lib/pipeline/pipeline";
import { pipelineQueries } from "@/lib/pipeline/pipeline.service";
import { cn } from "@/lib/utils";

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

const compactAction =
  "h-9 gap-2 rounded-lg border-[var(--orbit-border)] bg-white px-3 text-[0.75rem] font-semibold text-[var(--orbit-text-muted)] shadow-none hover:bg-[var(--orbit-surface-muted)] hover:text-[var(--orbit-text)]";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const canEditProject = hasPermission(context.user, PERMISSIONS.PROJECT_UPDATE);

  const project = await pipelineQueries.getProjectPipeline(projectId);
  if (!project) notFound();

  const pipeline = buildDeliveryPipeline(project, new Date());

  return (
    <div className="space-y-6">
      <header className="orbit-panel overflow-hidden">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
              {project.code} <span className="mx-1.5 opacity-60">/</span>
              <span className="text-[#6350c9]">Project overview</span>
            </p>
            <h1 className="text-[1.625rem] font-extrabold leading-tight tracking-[-0.02em] text-[var(--orbit-text)]">
              {project.name}
            </h1>
            <p className="mt-1 max-w-2xl text-[0.84rem] leading-5 text-[var(--orbit-text-muted)]">
              {project.description?.trim() ||
                "Project planning, delivery progress, ownership, risks, and key dates in one place."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold text-[var(--orbit-text-muted)]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--orbit-surface-muted)] px-2.5 py-1.5">
                <CalendarDays className="size-3.5 text-[var(--orbit-text-subtle)]" />
                {project.startDate ? dateLabel(project.startDate) : "Start not set"}
                <span aria-hidden="true">→</span>
                {project.targetDate ? dateLabel(project.targetDate) : "Target not set"}
              </span>
              <span className="rounded-md bg-[var(--orbit-surface-muted)] px-2.5 py-1.5">
                Code: {project.code}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {pipeline.atRiskCount ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f5dfb0] bg-[#fdf1dd] px-3 text-[0.75rem] font-bold text-[#b96a05]">
                <TriangleAlert className="size-3.5" />
                {pipeline.atRiskCount} at risk
              </span>
            ) : null}
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--orbit-border)] bg-white px-3 text-[0.75rem] font-semibold text-[var(--orbit-text-muted)]">
              Today{" "}
              <strong className="text-[var(--orbit-text)]">
                {dateLabel(pipeline.asOfDate)}
              </strong>
            </span>
            {canEditProject ? (
              <Button asChild variant="outline" size="sm" className={compactAction}>
                <Link href={`/projects/${project.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit project
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(compactAction, "cursor-not-allowed opacity-60")}
                disabled
                title="You do not have permission to edit this project"
              >
                <Pencil className="size-3.5" />
                Edit project
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className={compactAction}>
              <Link href={`/projects/${project.id}/pipeline`}>
                <Route className="size-3.5" />
                Open timeline
              </Link>
            </Button>
          </div>
        </div>

      </header>

      <ProjectExecutiveSnapshot pipeline={pipeline} />
      <ProjectOverviewFocus pipeline={pipeline} projectId={project.id} />
      <PhaseSummaryTable pipeline={pipeline} />
    </div>
  );
}
