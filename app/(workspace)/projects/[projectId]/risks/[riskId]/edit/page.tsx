import { notFound } from "next/navigation";

import { RiskForm } from "@/components/governance/risk-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { governanceQueries } from "@/lib/governance/governance.service";
import { dateInputValue } from "@/lib/projects/project.utils";

export default async function EditRiskPage({
  params,
}: {
  params: Promise<{ projectId: string; riskId: string }>;
}) {
  const { projectId, riskId } = await params;
  await requirePagePermission(PERMISSIONS.RISK_MANAGE, projectId);
  const [project, risk, setup] = await Promise.all([
    governanceQueries.getProject(projectId),
    governanceQueries.getRisk(projectId, riskId),
    governanceQueries.getSetup(projectId),
  ]);
  if (!project || !risk) notFound();
  const [workstreams, members, milestones, workItems, capabilities] = setup;
  const targetType = risk.workItemId
    ? "WORK_ITEM"
    : risk.sharedCapabilityId
      ? "SHARED_CAPABILITY"
      : "NONE";
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={`${project.code} / Governance`} title="Edit Risk" description="Update ownership, mitigation and project-scoped relationships." />
      <Card><CardHeader><CardTitle>{risk.title}</CardTitle></CardHeader><CardContent><RiskForm
        projectId={projectId}
        riskId={riskId}
        setup={{ workstreams, members, milestones, workItems, capabilities }}
        initialValues={{
          projectId,
          title: risk.title,
          description: risk.description,
          probability: risk.probability,
          impact: risk.impact,
          milestoneId: risk.milestoneId ?? "",
          targetType,
          targetId: risk.workItemId ?? risk.sharedCapabilityId ?? "",
          primaryWorkstreamId: risk.primaryWorkstreamId ?? "",
          ownerId: risk.ownerId ?? "",
          mitigation: risk.mitigation ?? "",
          dueDate: dateInputValue(risk.dueDate),
          status: risk.status,
        }}
      /></CardContent></Card>
    </div>
  );
}
