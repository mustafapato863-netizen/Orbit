import { notFound } from "next/navigation";
import { PilotIssueForm } from "@/components/pilot/pilot-issue-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pilotQueries } from "@/lib/pilot/pilot.service";
import { dateInputValue } from "@/lib/projects/project.utils";

export default async function EditPilotIssuePage({ params }: { params: Promise<{ projectId: string; issueId: string }> }) {
  const { projectId, issueId } = await params;
  await requirePagePermission(PERMISSIONS.PILOT_MANAGE, projectId);
  const [project, scope, setup] = await Promise.all([pilotQueries.getProject(projectId), pilotQueries.getScope(projectId), pilotQueries.getSetup(projectId)]);
  const issue = scope?.issues.find(({ id }) => id === issueId);
  if (!project || !scope || !issue) notFound();
  const [members] = setup;
  return <div className="space-y-8"><PageHeader eyebrow={`${project.code} / Controlled Pilot`} title="Edit Pilot issue" description="Update readiness impact, ownership, mitigation and resolution status." /><Card><CardHeader><CardTitle>{issue.title}</CardTitle></CardHeader><CardContent><PilotIssueForm projectId={projectId} issueId={issueId} members={members} initialValues={{ projectId, title: issue.title, description: issue.description ?? "", severity: issue.severity, status: issue.status, isBlocking: issue.isBlocking, ownerId: issue.ownerId ?? "", mitigation: issue.mitigation ?? "", dueDate: dateInputValue(issue.dueDate) }} /></CardContent></Card></div>;
}
