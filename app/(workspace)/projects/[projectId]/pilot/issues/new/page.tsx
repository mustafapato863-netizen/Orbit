import { notFound } from "next/navigation";
import { PilotIssueForm } from "@/components/pilot/pilot-issue-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";

export default async function NewPilotIssuePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope, setup] = await Promise.all([pilotQueries.getProject(projectId), pilotQueries.getScope(projectId), pilotQueries.getSetup(projectId)]);
  if (!project || !scope) notFound();
  const [members] = setup;
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Create Pilot issue" description="Record a blocker or limitation with severity, ownership and mitigation." /><Card><CardHeader><CardTitle>Issue details</CardTitle></CardHeader><CardContent><PilotIssueForm projectId={projectId} members={members} /></CardContent></Card></div>;
}
