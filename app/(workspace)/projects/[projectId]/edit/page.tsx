import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
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
import { projectQueries } from "@/lib/projects/project.service";
import { dateInputValue } from "@/lib/projects/project.utils";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(
    PERMISSIONS.PROJECT_UPDATE,
    projectId,
  );
  const project = await projectQueries.getProject(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={project.code}
        title="Edit project"
        description={`Update ${project.name}.`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            projectId={project.id}
            canManageVisibility={hasPermission(
              context.user,
              PERMISSIONS.SYSTEM_MANAGE,
            )}
            initialValues={{
              code: project.code,
              name: project.name,
              description: project.description ?? "",
              status: project.status as
                | "PLANNING"
                | "ACTIVE"
                | "ON_HOLD"
                | "AT_RISK"
                | "COMPLETED",
              progress: project.progress,
              isPrivate: project.isPrivate,
              projectType: project.projectType as
                | "CUSTOM"
                | "SOFTWARE"
                | "BUSINESS"
                | "OPERATIONS"
                | "CONSTRUCTION"
                | "MARKETING"
                | "HR"
                | "PROCUREMENT",
              setupTemplate: "CUSTOM",
              startDate: dateInputValue(project.startDate),
              targetDate: dateInputValue(project.targetDate),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
