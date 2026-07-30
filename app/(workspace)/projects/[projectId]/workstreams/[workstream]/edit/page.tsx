import { notFound } from "next/navigation";

import { WorkstreamForm } from "@/components/workstreams/workstream-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";
import { workstreamManagementQueries } from "@/lib/workstreams/workstream-management.service";

export default async function EditWorkstreamPage({
  params,
}: {
  params: Promise<{ projectId: string; workstream: string }>;
}) {
  const { projectId, workstream: workstreamId } = await params;
  await requirePagePermission(PERMISSIONS.PROJECT_UPDATE, projectId);
  const [project, workstream] = await Promise.all([
    projectQueries.getProject(projectId),
    workstreamManagementQueries.get(projectId, workstreamId),
  ]);
  if (!project || !workstream) notFound();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`${project.code} / Plan`} title={`Edit ${workstream.name}`} description="Update this project's delivery structure without affecting other projects." />
      <Card><CardHeader><CardTitle>Workstream details</CardTitle></CardHeader><CardContent>
        <WorkstreamForm
          projectId={projectId}
          workstreamId={workstream.id}
          initialValues={{
            name: workstream.name,
            description: workstream.description ?? "",
            colorToken: workstream.colorToken,
            iconKey: workstream.iconKey,
            sortOrder: workstream.sortOrder,
          }}
        />
      </CardContent></Card>
    </div>
  );
}
