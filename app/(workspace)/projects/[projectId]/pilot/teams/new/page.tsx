import { notFound } from "next/navigation";
import { PilotTeamForm } from "@/components/pilot/pilot-team-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";

export default async function NewPilotTeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope, setup] = await Promise.all([
    pilotQueries.getProject(projectId),
    pilotQueries.getScope(projectId),
    pilotQueries.getSetup(projectId),
  ]);
  if (!project || !scope) notFound();
  const [members] = setup;
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Create Pilot team" description="Define an operating team, lead and participating Pilot users." /><Card><CardHeader><CardTitle>Team details</CardTitle></CardHeader><CardContent><PilotTeamForm projectId={projectId} members={members} /></CardContent></Card></div>;
}
