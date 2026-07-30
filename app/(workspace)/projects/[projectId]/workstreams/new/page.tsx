import { notFound } from "next/navigation";

import { WorkstreamForm } from "@/components/workstreams/workstream-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { projectQueries } from "@/lib/projects/project.service";

export default async function NewWorkstreamPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.PROJECT_UPDATE, projectId);
  const project = await projectQueries.getProject(projectId);
  if (!project) notFound();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={`${project.code} / Plan`} title="Add workstream" description="Create an execution lane that matches how this project is actually delivered." />
      <Card><CardHeader><CardTitle>Workstream details</CardTitle></CardHeader><CardContent><WorkstreamForm projectId={projectId} /></CardContent></Card>
    </div>
  );
}
