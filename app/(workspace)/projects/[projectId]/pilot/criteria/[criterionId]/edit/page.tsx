import { notFound } from "next/navigation";
import { PilotCriterionForm } from "@/components/pilot/pilot-criterion-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";

export default async function EditPilotCriterionPage({ params }: { params: Promise<{ projectId: string; criterionId: string }> }) {
  const { projectId, criterionId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope] = await Promise.all([pilotQueries.getProject(projectId), pilotQueries.getScope(projectId)]);
  const criterion = scope?.criteria.find(({ id }) => id === criterionId);
  if (!project || !scope || !criterion) notFound();
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Edit gate criterion" description="Update the criterion definition; Reviewer evidence and outcome remain separate." /><Card><CardHeader><CardTitle>{criterion.title}</CardTitle></CardHeader><CardContent><PilotCriterionForm projectId={projectId} criterionId={criterionId} initialValues={{ projectId, code: criterion.code, type: criterion.type, title: criterion.title, description: criterion.description ?? "", isRequired: criterion.isRequired }} /></CardContent></Card></div>;
}
