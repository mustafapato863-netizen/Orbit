import { notFound } from "next/navigation";

import { RiskForm } from "@/components/governance/risk-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { governanceQueries } from "@/lib/governance/governance.service";

export default async function NewRiskPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.RISK_MANAGE, projectId);
  const [project, setup] = await Promise.all([
    governanceQueries.getProject(projectId),
    governanceQueries.getSetup(projectId),
  ]);
  if (!project) notFound();
  const [workstreams, members, milestones, workItems, capabilities] = setup;
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={`${project.code} / Governance`} title="Create Risk" description="Record probability and impact; Orbit derives a consistent Severity." />
      <Card><CardHeader><CardTitle>Risk details</CardTitle></CardHeader><CardContent><RiskForm projectId={projectId} setup={{ workstreams, members, milestones, workItems, capabilities }} /></CardContent></Card>
    </div>
  );
}
