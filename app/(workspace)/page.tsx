import {
  ArrowUpRight,
  FolderKanban,
  Layers3,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission } from "@/lib/auth/policy";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";
import { displayEnum } from "@/lib/projects/project.utils";
import { groupProjectsByProjectGroup } from "@/lib/project-groups/group-projects";

export default async function WorkspaceHome() {
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW);
  const isAdministrator = hasPermission(context.user, PERMISSIONS.SYSTEM_MANAGE);
  const canCreate = hasPermission(context.user, PERMISSIONS.PROJECT_CREATE);
  const projects = await projectQueries.listProjects(context.user.id, isAdministrator);

  const activeCount = projects.filter((project) => project.status === "ACTIVE").length;
  const planningCount = projects.filter((project) => project.status === "PLANNING").length;
  const averageProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
    : 0;
  const recentProjects = projects.slice(0, 4);
  const groupedProjects = groupProjectsByProjectGroup(projects).filter(
    (section) => section.group,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workspace"
        title="Command centre"
        description="A concise view of your portfolio health and the projects that need attention."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-10 rounded-lg px-4">
              <Link href="/projects">
                <FolderKanban className="size-4" />
                Browse projects
              </Link>
            </Button>
            {canCreate ? (
              <Button asChild className="h-10 rounded-lg px-4 shadow-[0_6px_16px_rgba(110,90,230,0.18)]">
                <Link href="/projects/new">
                  <Plus className="size-4" />
                  Create project
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title="Your workspace is ready"
          description={canCreate ? "Create a project to start building your delivery portfolio." : "You have not been assigned to an active project yet."}
          action={canCreate ? <Button asChild><Link href="/projects/new">Create project</Link></Button> : undefined}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace summary">
            <WorkspaceMetric label="Projects" value={projects.length} detail="Visible to you" icon={FolderKanban} />
            <WorkspaceMetric label="Active" value={activeCount} detail="Currently moving" icon={TrendingUp} tone="blue" />
            <WorkspaceMetric label="Planning" value={planningCount} detail="Needs kickoff" icon={Layers3} tone="amber" />
            <WorkspaceMetric label="Average progress" value={`${averageProgress}%`} detail="Across visible projects" icon={TrendingUp} tone="green" />
          </section>

          <section aria-labelledby="workspace-groups-heading">
            <div className="mb-3.5 flex items-end justify-between gap-4">
              <div>
                <h2 id="workspace-groups-heading" className="text-[0.95rem] font-bold text-[var(--orbit-text)]">
                  Project groups
                </h2>
                <p className="mt-1 text-[0.75rem] text-[var(--orbit-text-subtle)]">
                  Open a group to jump straight into the projects it contains.
                </p>
              </div>
              <Link href="/projects" className="text-[0.75rem] font-semibold text-[var(--orbit-purple)] hover:underline">
                Manage groups
              </Link>
            </div>
            {groupedProjects.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupedProjects.map((section) => {
                  const group = section.group!;
                  const progress = Math.round(
                    section.projects.reduce((total, project) => total + project.progress, 0) /
                      section.projects.length,
                  );

                  return (
                    <Card
                      key={group.id}
                      className="overflow-hidden rounded-2xl border-[var(--orbit-border)] shadow-[var(--orbit-shadow-xs)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(16,24,40,0.08)]"
                    >
                      <div className="h-1" style={{ backgroundColor: group.colorToken }} aria-hidden="true" />
                      <CardHeader className="px-5 pb-3 pt-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${group.colorToken}18`, color: group.colorToken }}
                            >
                              <Layers3 className="size-[18px]" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <CardTitle className="truncate text-[1rem]" title={group.name}>{group.name}</CardTitle>
                              <p className="mt-1 text-[0.72rem] text-[var(--orbit-text-subtle)]">
                                {section.projects.length} {section.projects.length === 1 ? "project" : "projects"}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/projects#project-group-${group.id}`}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--orbit-border)] text-[var(--orbit-text-muted)] transition-colors hover:border-[var(--orbit-purple)] hover:text-[var(--orbit-purple)]"
                            aria-label={`Open ${group.name} in Projects`}
                            title="Open group"
                          >
                            <ArrowUpRight className="size-4" />
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 px-5 pb-5 pt-0">
                        <div>
                          <div className="flex items-center justify-between text-[0.7rem]">
                            <span className="font-semibold text-[var(--orbit-text-muted)]">Group progress</span>
                            <span className="font-bold text-[var(--orbit-text)]">{progress}%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7e9f0]">
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: group.colorToken }} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {section.projects.slice(0, 3).map((project) => (
                            <Link
                              key={project.id}
                              href={`/projects/${project.id}`}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.75rem] text-[var(--orbit-text-muted)] transition-colors hover:bg-[var(--orbit-surface-muted)] hover:text-[var(--orbit-text)]"
                            >
                              <FolderKanban className="size-3.5 shrink-0" aria-hidden="true" />
                              <span className="min-w-0 flex-1 truncate">{project.name}</span>
                              <span className="shrink-0 text-[0.68rem] font-bold text-[var(--orbit-text-subtle)]">{project.progress}%</span>
                            </Link>
                          ))}
                          {section.projects.length > 3 ? (
                            <Link href={`/projects#project-group-${group.id}`} className="block px-2 pt-1 text-[0.7rem] font-semibold text-[var(--orbit-purple)] hover:underline">
                              + {section.projects.length - 3} more projects
                            </Link>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-2xl border-dashed border-[var(--orbit-border)] bg-[var(--orbit-surface-muted)] shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-8 text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--orbit-purple-soft)] text-[var(--orbit-purple)]"><Layers3 className="size-[18px]" /></span>
                  <p className="mt-3 text-sm font-bold text-[var(--orbit-text)]">No groups yet</p>
                  <p className="mt-1 max-w-md text-[0.75rem] text-[var(--orbit-text-subtle)]">Create a group from Projects to organize related work in this gallery.</p>
                  <Button asChild variant="outline" size="sm" className="mt-4 h-9 rounded-lg"><Link href="/projects">Open Projects</Link></Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
            <Card className="overflow-hidden rounded-2xl border-[var(--orbit-border)] shadow-[var(--orbit-shadow-xs)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[var(--orbit-border-soft)] px-5 py-4">
                <div>
                  <CardTitle className="text-[1rem]">Recent projects</CardTitle>
                  <p className="mt-1 text-[0.76rem] text-[var(--orbit-text-subtle)]">Open a project command centre to continue delivery work.</p>
                </div>
                <Link href="/projects" className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[var(--orbit-purple)] hover:underline">
                  View all <ArrowUpRight className="size-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="divide-y divide-[var(--orbit-border-soft)] p-0">
                {recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--orbit-surface-muted)]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--orbit-purple-soft)] text-[var(--orbit-purple)]">
                      <FolderKanban className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[0.84rem] font-bold text-[var(--orbit-text)]">{project.name}</span>
                        <span className="shrink-0 font-mono text-[0.63rem] font-semibold text-[var(--orbit-text-subtle)]">{project.code}</span>
                      </span>
                      <span className="mt-1 block truncate text-[0.72rem] text-[var(--orbit-text-subtle)]">{project.description || "No description recorded."}</span>
                    </span>
                    <span className="hidden items-center gap-3 sm:flex">
                      <span className="w-20">
                        <span className="flex justify-between text-[0.64rem] font-semibold text-[var(--orbit-text-subtle)]"><span>Progress</span><span>{project.progress}%</span></span>
                        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#e5e7ef]"><span className="block h-full rounded-full bg-[var(--orbit-purple)]" style={{ width: `${project.progress}%` }} /></span>
                      </span>
                      <ProjectStatusBadge status={project.status} label={displayEnum(project.status)} className="shrink-0 text-[0.66rem]" />
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-[var(--orbit-text-subtle)]" aria-hidden="true" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[var(--orbit-border)] shadow-[var(--orbit-shadow-xs)]">
              <CardHeader className="px-5 pb-2 pt-5">
                <CardTitle className="text-[1rem]">Workspace guide</CardTitle>
                <p className="mt-1 text-[0.76rem] text-[var(--orbit-text-subtle)]">Keep portfolio navigation and project execution in their own spaces.</p>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5 pt-3">
                <GuideRow title="Workspace" description="Portfolio health and quick access." href="/" active />
                <GuideRow title="Projects" description="Create, group, and open projects." href="/projects" />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function WorkspaceMetric({ label, value, detail, icon: Icon, tone = "purple" }: { label: string; value: number | string; detail: string; icon: typeof FolderKanban; tone?: "purple" | "blue" | "amber" | "green" }) {
  const tones = {
    purple: "bg-[var(--orbit-purple-soft)] text-[var(--orbit-purple)]",
    blue: "bg-[#e8f1ff] text-[#2563eb]",
    amber: "bg-[#fff4dd] text-[#b7791f]",
    green: "bg-[#e5f7f0] text-[#0f8f67]",
  };
  return <Card className="rounded-2xl border-[var(--orbit-border)] shadow-[var(--orbit-shadow-xs)]"><CardContent className="flex items-center gap-3.5 p-4"><span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-[18px]" /></span><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">{label}</p><p className="mt-0.5 text-2xl font-extrabold tracking-[-0.04em] text-[var(--orbit-text)]">{value}</p><p className="text-[0.68rem] text-[var(--orbit-text-subtle)]">{detail}</p></div></CardContent></Card>;
}

function GuideRow({ title, description, href, active = false }: { title: string; description: string; href: string; active?: boolean }) {
  return <Link href={href} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${active ? "border-[#ddd7ff] bg-[var(--orbit-purple-soft)]" : "border-[var(--orbit-border-soft)] hover:bg-[var(--orbit-surface-muted)]"}`}><span className={`size-2 rounded-full ${active ? "bg-[var(--orbit-purple)]" : "bg-[var(--orbit-text-subtle)]"}`} /><span className="min-w-0 flex-1"><span className="block text-[0.8rem] font-bold text-[var(--orbit-text)]">{title}</span><span className="mt-0.5 block text-[0.7rem] text-[var(--orbit-text-subtle)]">{description}</span></span><ArrowUpRight className="size-3.5 text-[var(--orbit-text-subtle)]" /></Link>;
}
