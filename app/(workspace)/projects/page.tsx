import { CalendarDays, EyeOff, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";

import { ProjectArchiveButton } from "@/components/projects/project-archive-button";
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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Projects you are authorized to view, with concise milestone and membership summaries."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/projects/new">
                <Plus />
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
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {project.code}
                      {project.isPrivate ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#efebff] px-2 py-0.5 text-[0.625rem] font-bold text-[#6350c9]">
                          <EyeOff className="size-3" aria-hidden="true" />
                          Admin only
                        </span>
                      ) : null}
                    </p>
                    <CardTitle className="mt-2 truncate text-lg">
                      {project.name}
                    </CardTitle>
                  </div>
                  <ProjectStatusBadge
                    status={project.status}
                    label={displayEnum(project.status)}
                  />
                </div>
                <CardDescription className="line-clamp-2 min-h-10">
                  {project.description || "No project description recorded."}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-5">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="size-3.5" />
                    {project._count.milestones} milestones
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {project._count.members} members
                  </span>
                  <span className="col-span-2 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Target{" "}
                    {project.targetDate?.toISOString().slice(0, 10) ?? "not set"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Button asChild variant="outline" className="h-10 flex-1">
                    <Link href={`/projects/${project.id}`}>View project</Link>
                  </Button>
                  {canArchive ? (
                    <ProjectArchiveButton
                      projectId={project.id}
                      projectName={project.name}
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
