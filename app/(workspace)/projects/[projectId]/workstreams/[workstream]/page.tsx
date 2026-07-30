import { notFound } from "next/navigation";

import { WorkstreamDashboard } from "@/components/workstreams/workstream-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { workstreamQueries } from "@/lib/workstreams/workstreams.service";

export default async function TechnicalWorkstreamPage({
  params,
}: {
  params: Promise<{ projectId: string; workstream: string }>;
}) {
  const { projectId, workstream } = await params;
  await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const view = await workstreamQueries.getProjectWorkstream(projectId, workstream);
  if (!view) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${view.project.code} / Workstream`}
        title={`${view.workstream.name} Workstream`}
        description={view.workstream.description ?? "Project work grouped by accountable ownership and supporting contribution."}
      />
      <WorkstreamDashboard view={view} />
    </div>
  );
}
