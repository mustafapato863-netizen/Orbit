import { notFound } from "next/navigation";
import { PilotTeamForm } from "@/components/pilot/pilot-team-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";

export default async function EditPilotTeamPage({ params }: { params: Promise<{ projectId: string; teamId: string }> }) {
  const { projectId, teamId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope, setup] = await Promise.all([
    pilotQueries.getProject(projectId),
    pilotQueries.getScope(projectId),
    pilotQueries.getSetup(projectId),
  ]);
  const team = scope?.teams.find(({ id }) => id === teamId);
  if (!project || !scope || !team) notFound();
  const [members] = setup;
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Edit Pilot team" description="Maintain the team lead and unique project members participating in Pilot." /><Card><CardHeader><CardTitle>{team.name}</CardTitle></CardHeader><CardContent><PilotTeamForm projectId={projectId} teamId={teamId} members={members} initialValues={{ projectId, name: team.name, description: team.description ?? "", leadUserId: team.leadUserId ?? "", memberIds: team.members.map(({ userId }) => userId) }} /></CardContent></Card></div>;
}
