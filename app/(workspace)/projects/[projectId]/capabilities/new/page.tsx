import { notFound } from "next/navigation";

import { CapabilityForm } from "@/components/execution/capability-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { executionQueries } from "@/lib/execution/execution.service";
import { projectQueries } from "@/lib/projects/project.service";

export default async function NewCapabilityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(
    PERMISSIONS.SHARED_CAPABILITY_MANAGE,
    projectId,
  );
  const [project, setup] = await Promise.all([
    projectQueries.getProject(projectId),
    executionQueries.getSetup(projectId),
  ]);
  if (!project) notFound();
  const [workstreams, members, milestones] = setup;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={project.code}
        title="Create Shared Capability"
        description="Create one shared record and link it to every dependent milestone."
      />
      <Card>
        <CardHeader>
          <CardTitle>Canonical capability</CardTitle>
        </CardHeader>
        <CardContent>
          <CapabilityForm
            projectId={projectId}
            workstreams={workstreams}
            members={members}
            milestones={milestones}
          />
        </CardContent>
      </Card>
    </div>
  );
}
