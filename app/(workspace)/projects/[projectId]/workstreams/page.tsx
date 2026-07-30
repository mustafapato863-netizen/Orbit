import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Boxes,
  GitBranch,
  Layers3,
  LayoutList,
  Pencil,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { executionQueries } from "@/lib/execution/execution.service";
import { projectQueries } from "@/lib/projects/project.service";
import { workstreamQueries } from "@/lib/workstreams/workstreams.service";

export default async function WorkstreamsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, capabilities, workstreams] = await Promise.all([
    projectQueries.getProject(projectId),
    executionQueries.listCapabilities(projectId),
    workstreamQueries.listProjectWorkstreams(projectId),
  ]);
  if (!project) notFound();

  const canManagePlan = hasPermission(context.user, PERMISSIONS.PROJECT_UPDATE);
  const canManageMilestones = hasPermission(context.user, PERMISSIONS.MILESTONE_MANAGE);
  const blockedCapabilityCount = capabilities.filter(
    ({ status, blocker }) => status === "BLOCKED" || Boolean(blocker),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${project.code} / Plan`}
        title="Project plan"
        description="Organize delivery around the teams, functions, or disciplines that fit this project."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManagePlan ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${projectId}/workstreams/new`}>
                  <Plus />Add workstream
                </Link>
              </Button>
            ) : null}
            {canManageMilestones ? (
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/milestones/new`}>
                  <Plus />Add milestone
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {workstreams.length ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workstreams.map((view) => (
            <article
              key={view.workstream.id}
              className="group rounded-xl border border-[var(--orbit-border)] bg-white p-4 shadow-[var(--orbit-shadow-xs)] transition hover:border-[#d8d3ff] hover:shadow-[var(--orbit-shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/projects/${projectId}/workstreams/${view.workstream.slug}`}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: view.workstream.colorToken }}
                  >
                    <Layers3 className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.62rem] font-bold uppercase tracking-[0.07em] text-[var(--orbit-text-subtle)]">
                      Workstream
                    </span>
                    <strong className="mt-1 block truncate text-[0.95rem] text-[var(--orbit-text)]">
                      {view.workstream.name}
                    </strong>
                    <span className="mt-1 block min-h-10 text-[0.72rem] leading-5 text-[var(--orbit-text-subtle)]">
                      {view.workstream.description || "Project delivery ownership."}
                    </span>
                  </span>
                </Link>
                {canManagePlan ? (
                  <Button asChild size="icon" variant="ghost" aria-label={`Edit ${view.workstream.name}`}>
                    <Link href={`/projects/${projectId}/workstreams/${view.workstream.id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-[#fafbfc] px-3 py-2.5 text-center">
                {[
                  ["Items", view.metrics.unique],
                  ["Active", view.metrics.inProgress],
                  ["Blocked", view.metrics.blocked],
                  ["Progress", `${view.metrics.averageProgress}%`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.58rem] font-bold uppercase text-[var(--orbit-text-subtle)]">{label}</dt>
                    <dd className="mt-1 text-[0.82rem] font-extrabold text-[var(--orbit-text)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Layers3}
          title="No workstreams yet"
          description="This project started blank. Add the teams, functions, or disciplines that own its delivery."
          action={
            canManagePlan ? (
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/workstreams/new`}><Plus />Add first workstream</Link>
              </Button>
            ) : undefined
          }
        />
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <Link href={`/projects/${projectId}/capabilities`} className="rounded-xl border border-[var(--orbit-border)] bg-white p-4 shadow-[var(--orbit-shadow-xs)] hover:border-[#d8d3ff]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#efebff] text-[#6350c9]"><Boxes className="size-5" /></span>
            <div><h2 className="font-extrabold">Shared work</h2><p className="mt-1 text-xs text-[var(--orbit-text-subtle)]">Common deliverables referenced by multiple milestones and counted once.</p><p className="mt-3 text-xs font-bold text-[var(--orbit-text-muted)]">{capabilities.length} shared items · {blockedCapabilityCount} blocked</p></div>
          </div>
        </Link>
        <Link href={`/projects/${projectId}#timeline-roadmap`} className="rounded-xl border border-[var(--orbit-border)] bg-white p-4 shadow-[var(--orbit-shadow-xs)] hover:border-[#d8d3ff]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#e3f8f4] text-[#0c8e7e]"><LayoutList className="size-5" /></span>
            <div><h2 className="font-extrabold">Milestone plan</h2><p className="mt-1 text-xs text-[var(--orbit-text-subtle)]">Review milestones and detailed execution rows.</p><p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#6350c9]"><GitBranch className="size-3.5" />Open detailed plan</p></div>
          </div>
        </Link>
      </section>
    </div>
  );
}
