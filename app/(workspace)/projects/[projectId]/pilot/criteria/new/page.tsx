import { notFound } from "next/navigation";
import { PilotCriterionForm } from "@/components/pilot/pilot-criterion-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";

export default async function NewPilotCriterionPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope] = await Promise.all([pilotQueries.getProject(projectId), pilotQueries.getScope(projectId)]);
  if (!project || !scope) notFound();
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Create gate criterion" description="Add a required or optional Entry or Exit readiness condition." /><Card><CardHeader><CardTitle>Criterion definition</CardTitle></CardHeader><CardContent><PilotCriterionForm projectId={projectId} /></CardContent></Card></div>;
}
