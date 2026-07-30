import { notFound } from "next/navigation";

import { DecisionForm } from "@/components/governance/decision-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { governanceQueries } from "@/lib/governance/governance.service";

export default async function NewDecisionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.DECISION_MANAGE, projectId);
  const [project, setup] = await Promise.all([
    governanceQueries.getProject(projectId),
    governanceQueries.getSetup(projectId),
  ]);
  if (!project) notFound();
  const [workstreams, members, milestones] = setup;
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={`${project.code} / Governance`} title="Create Decision" description="Frame the required management decision, recommendation and accountable owner." />
      <Card><CardHeader><CardTitle>Decision details</CardTitle></CardHeader><CardContent><DecisionForm projectId={projectId} setup={{ workstreams, members, milestones }} /></CardContent></Card>
    </div>
  );
}
