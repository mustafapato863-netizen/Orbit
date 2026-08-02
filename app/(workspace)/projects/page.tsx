import {
  ArrowUpRight,
  CalendarDays,
  EyeOff,
  FolderKanban,
  Layers3,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ProjectArchiveButton } from "@/components/projects/project-archive-button";
import { ProjectGroupManager } from "@/components/projects/project-group-manager";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission } from "@/lib/auth/policy";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";
import { groupProjectsByProjectGroup } from "@/lib/project-groups/group-projects";
import { projectGroupQueries } from "@/lib/project-groups/project-group.service";
import { displayEnum } from "@/lib/projects/project.utils";

export default async function ProjectsPage() {
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW);
  const isAdministrator = hasPermission(
    context.user,
    PERMISSIONS.SYSTEM_MANAGE,
  );
  const canCreate = hasPermission(context.user, PERMISSIONS.PROJECT_CREATE);
  const canArchive = hasPermission(context.user, PERMISSIONS.PROJECT_UPDATE);
  const projects = await projectQueries.listProjects(
    context.user.id,
    isAdministrator,
  );
  const groups = isAdministrator
    ? await projectGroupQueries.listActiveGroups()
    : [];
  const projectSections = groupProjectsByProjectGroup(projects);
  const activeCount = projects.filter((project) => project.status === "ACTIVE").length;
  const planningCount = projects.filter((project) => project.status === "PLANNING").length;
  const privateCount = projects.filter((project) => project.isPrivate).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Your delivery portfolio, with the next action and health of every project in one view."
        actions={
          canCreate ? (
            <Button
              asChild
              className="h-10 rounded-lg px-4 shadow-[0_6px_16px_rgba(110,90,230,0.18)]"
            >
              <Link href="/projects/new">
                <Plus className="size-4" />
                Create project
              </Link>
            </Button>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects available"
          description={
            canCreate
              ? "Create the first project to begin planning business milestones."
              : "You have not been assigned to an active project."
          }
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/projects/new">Create project</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <section
            className="orbit-panel grid gap-px overflow-hidden bg-[var(--orbit-border-soft)] sm:grid-cols-3"
            aria-label="Project portfolio summary"
          >
            <div className="flex items-center gap-3 bg-white px-4 py-3.5 sm:px-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--orbit-purple-soft)] text-[var(--orbit-purple)]">
                <Layers3 className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
                  Portfolio
                </p>
                <p className="mt-0.5 text-[0.78rem] font-medium text-[var(--orbit-text-muted)]">
                  A clear view of what is moving
                </p>
              </div>
            </div>
            <SummaryMetric label="Active" value={activeCount} tone="text-[var(--orbit-blue)]" />
            <SummaryMetric
              label="Planning"
              value={planningCount}
              tone="text-[var(--orbit-text)]"
              detail={privateCount ? `${privateCount} admin only` : undefined}
            />
          </section>

          {isAdministrator ? (
            <ProjectGroupManager
              groups={groups.map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                colorToken: group.colorToken,
                sortOrder: group.sortOrder,
                projects: group.projects.map((project) => ({
                  id: project.id,
                  code: project.code,
                  name: project.name,
                })),
              }))}
              projects={projects.map((project) => ({
                id: project.id,
                code: project.code,
                name: project.name,
              }))}
            />
          ) : null}

          <section aria-labelledby="projects-heading">
            <div className="mb-3.5 flex items-end justify-between gap-4">
              <div>
                <h2 id="projects-heading" className="text-[0.95rem] font-bold text-[var(--orbit-text)]">
                  Your projects
                </h2>
                <p className="mt-1 text-[0.75rem] text-[var(--orbit-text-subtle)]">
                  Select a project to open its command centre.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--orbit-border)] bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--orbit-text-muted)]">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <div className="space-y-6">
              {projectSections.map((section) => (
                <div key={section.group?.id ?? "ungrouped"}>
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          section.group?.colorToken ?? "#9ba3b7",
                      }}
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-bold text-[var(--orbit-text)]">
                      {section.group?.name ?? "Ungrouped projects"}
                    </h3>
                    <span className="rounded-full bg-[var(--orbit-surface-muted)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--orbit-text-subtle)]">
                      {section.projects.length}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.projects.map((project) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden rounded-2xl border-[var(--orbit-border)] py-0 shadow-[var(--orbit-shadow-xs)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#d8d3ff] hover:shadow-[0_12px_28px_rgba(16,24,40,0.08)]"
                >
                  <div className="h-1 bg-[var(--orbit-purple)] opacity-90" aria-hidden="true" />
                  <CardHeader className="gap-0 px-5 pb-0 pt-5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--orbit-surface-muted)] text-[var(--orbit-purple)] ring-1 ring-inset ring-[var(--orbit-border-soft)]">
                          <FolderKanban className="size-[18px]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="font-mono text-[0.68rem] font-semibold tracking-[0.04em] text-[var(--orbit-text-subtle)]">
                              {project.code}
                            </p>
                            {project.isPrivate ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--orbit-purple-soft)] px-2 py-0.5 text-[0.625rem] font-bold text-[var(--orbit-purple)]">
                                <EyeOff className="size-3" aria-hidden="true" />
                                Admin only
                              </span>
                            ) : null}
                          </div>
                          <CardTitle
                            title={project.name}
                            className="mt-1.5 truncate text-[1.08rem] leading-6 tracking-[-0.01em]"
                          >
                            {project.name}
                          </CardTitle>
                        </div>
                      </div>
                      <ProjectStatusBadge
                        status={project.status}
                        label={displayEnum(project.status)}
                        className="shrink-0 text-[0.68rem]"
                      />
                    </div>
                    <CardDescription className="mt-4 line-clamp-2 min-h-[42px] text-[0.8rem] leading-5">
                      {project.description || "No project description recorded."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="mt-auto space-y-4 px-5 pb-5 pt-5">
                    <div className="rounded-xl border border-[var(--orbit-border-soft)] bg-[var(--orbit-surface-muted)] p-3">
                      <div className="flex items-center justify-between text-[0.72rem]">
                        <span className="font-semibold text-[var(--orbit-text-muted)]">Overall progress</span>
                        <span className="font-bold text-[var(--orbit-text)]">{project.progress}%</span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e5e7ef]">
                        <div
                          className="h-full rounded-full bg-[var(--orbit-purple)] transition-[width] duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 divide-x divide-[var(--orbit-border-soft)] rounded-xl border border-[var(--orbit-border-soft)] bg-white">
                      <MetaMetric icon={FolderKanban} label="Milestones" value={project._count.milestones} />
                      <MetaMetric icon={Users} label="Members" value={project._count.members} />
                    </dl>

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--orbit-border-soft)] pt-4">
                      <div className="min-w-0 text-[0.7rem] text-[var(--orbit-text-muted)]">
                        <span className="flex items-center gap-1.5 font-semibold text-[var(--orbit-text-subtle)]">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          Target date
                        </span>
                        <span className="mt-0.5 block truncate font-semibold text-[var(--orbit-text)]">
                          {project.targetDate?.toISOString().slice(0, 10) ?? "Not set"}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild size="sm" className="h-9 rounded-lg px-3 text-[0.72rem]">
                          <Link href={`/projects/${project.id}`}>
                            View project
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </Button>
                        {canArchive ? (
                          <ProjectArchiveButton
                            projectId={project.id}
                            projectName={project.name}
                          />
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: number;
  tone: string;
  detail?: string;
}) {
  return (
    <div className="bg-white px-4 py-3.5 sm:px-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className={`text-xl font-extrabold tracking-[-0.03em] ${tone}`}>{value}</span>
        {detail ? <span className="text-[0.68rem] font-medium text-[var(--orbit-text-subtle)]">{detail}</span> : null}
      </div>
    </div>
  );
}

function MetaMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Icon className="size-3.5 text-[var(--orbit-text-subtle)]" aria-hidden="true" />
      <div>
        <dt className="text-[0.65rem] font-medium text-[var(--orbit-text-subtle)]">{label}</dt>
        <dd className="mt-0.5 text-[0.78rem] font-bold text-[var(--orbit-text)]">{value}</dd>
      </div>
    </div>
  );
}
