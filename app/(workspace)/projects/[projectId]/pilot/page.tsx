import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArchivePilotRecordButton,
  FinalPilotDecisionForm,
  PilotCapabilityControl,
  PilotCriterionReviewForm,
  PilotSignOffReviewForm,
} from "@/components/pilot/pilot-controls";
import { PilotScopeForm } from "@/components/pilot/pilot-scope-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { derivePilotReadiness, type GateStatus } from "@/lib/pilot/pilot-readiness";
import { pilotQueries } from "@/lib/pilot/pilot.service";
import { displayEnum } from "@/lib/projects/project.utils";

function gateBadge(status: GateStatus) {
  return (
    <StatusBadge
      status={status === "READY" ? "completed" : status === "BLOCKED" ? "blocked" : "not-started"}
      label={status === "READY" ? "Ready" : displayEnum(status)}
    />
  );
}

function reviewBadge(status: "PENDING" | "APPROVED" | "REJECTED") {
  return (
    <StatusBadge
      status={status === "APPROVED" ? "completed" : status === "REJECTED" ? "blocked" : "not-started"}
      label={displayEnum(status)}
    />
  );
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(value)
    : "Not set";
}

export default async function ControlledPilotPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, scope, setup, approvalHistory] = await Promise.all([
    pilotQueries.getProject(projectId),
    pilotQueries.getScope(projectId),
    pilotQueries.getSetup(projectId),
    pilotQueries.listApprovalHistory(projectId),
  ]);
  if (!project) notFound();
  const [members, capabilities] = setup;
  const canManage = hasPermission(context.user, PERMISSIONS.PILOT_MANAGE);
  const canReview = hasPermission(context.user, PERMISSIONS.PILOT_REVIEW);

  if (!scope) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow={`${project.code} / Release`} title="Controlled Pilot" description="Define the teams, scope, gates, ownership and approvals for a controlled release." />
        {canManage ? (
          <Card>
            <CardHeader><CardTitle>Create Pilot workspace</CardTitle><CardDescription>Start with accountable support and rollback ownership.</CardDescription></CardHeader>
            <CardContent><PilotScopeForm projectId={projectId} members={members} /></CardContent>
          </Card>
        ) : (
          <EmptyState icon={ShieldCheck} title="Pilot workspace not configured" description="A Project Manager must configure the Controlled Pilot workspace." />
        )}
      </div>
    );
  }

  const readiness = derivePilotReadiness(scope);
  const included = scope.capabilities.filter(({ disposition }) => disposition === "INCLUDED");
  const deferred = scope.capabilities.filter(({ disposition }) => disposition === "DEFERRED");
  const pilotUserCount = new Set(
    scope.teams.flatMap(({ members: teamMembers }) => teamMembers.map(({ userId }) => userId)),
  ).size;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} / Release`}
        title={scope.name}
        description="Controlled Pilot scope, accountable teams, readiness gates, blockers and approval evidence."
        actions={canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href={`/projects/${projectId}/pilot/teams/new`}><Plus />Team</Link></Button>
            <Button asChild variant="outline"><Link href={`/projects/${projectId}/pilot/criteria/new`}><Plus />Criterion</Link></Button>
            <Button asChild><Link href={`/projects/${projectId}/pilot/issues/new`}><Plus />Issue</Link></Button>
          </div>
        ) : undefined}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Included in Pilot" value={included.length} icon={CheckCircle2} tone="green" />
        <MetricCard label="Deferred after Pilot" value={deferred.length} icon={ClipboardCheck} tone="purple" />
        <MetricCard label="Entry gate" value={readiness.entryGateStatus === "READY" ? "Ready" : displayEnum(readiness.entryGateStatus)} icon={ShieldCheck} tone="blue" />
        <MetricCard label="Exit gate" value={readiness.exitGateStatus === "READY" ? "Ready" : displayEnum(readiness.exitGateStatus)} icon={ShieldCheck} tone="blue" />
        <MetricCard label="Open blockers" value={readiness.openBlockers} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Approval readiness" value={readiness.approvalReady ? "Ready" : "Not ready"} icon={ShieldCheck} tone={readiness.approvalReady ? "green" : "amber"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card>
          <CardHeader><CardTitle>Pilot overview</CardTitle><CardDescription>Operational ownership and known release limitations.</CardDescription></CardHeader>
          <CardContent>
            {canManage ? (
              <PilotScopeForm
                projectId={projectId}
                members={members}
                initialValues={{
                  projectId,
                  name: scope.name,
                  knownLimitations: scope.knownLimitations ?? "",
                  supportOwnerId: scope.supportOwnerId ?? "",
                  rollbackOwnerId: scope.rollbackOwnerId ?? "",
                }}
              />
            ) : (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Support owner</dt><dd className="font-medium">{scope.supportOwner?.displayName ?? "Unassigned"}</dd></div>
                <div><dt className="text-muted-foreground">Rollback owner</dt><dd className="font-medium">{scope.rollbackOwner?.displayName ?? "Unassigned"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Known limitations</dt><dd className="mt-1">{scope.knownLimitations ?? "None recorded"}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Readiness summary</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><span>Entry gate status</span>{gateBadge(readiness.entryGateStatus)}</div>
            <div className="flex items-center justify-between"><span>Exit gate status</span>{gateBadge(readiness.exitGateStatus)}</div>
            <div className="flex items-center justify-between"><span>Business sign-off</span>{reviewBadge(scope.businessSignOffStatus)}</div>
            <div className="flex items-center justify-between"><span>Technical sign-off</span>{reviewBadge(scope.technicalSignOffStatus)}</div>
            <div className="flex items-center justify-between"><span>Teams / Pilot users</span><span className="font-semibold">{scope.teams.length} / {pilotUserCount}</span></div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-semibold">{readiness.approvalReady ? "Approval ready" : "Approval conditions remain"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Final approval requires configured owners and scope, ready gates, both sign-offs, and no open blocking issues.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Pilot teams and users</h2><p className="text-sm text-muted-foreground">Proposed operating teams and the project members participating in Pilot.</p></div>
        <div className="grid gap-4 xl:grid-cols-3">
          {scope.teams.map((team) => (
            <Card key={team.id}>
              <CardHeader><CardTitle>{team.name}</CardTitle><CardDescription>{team.description ?? "No description"}</CardDescription></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p><span className="text-muted-foreground">Team lead:</span> {team.leadUser?.displayName ?? "Unassigned"}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pilot users ({team.members.length})</p>
                  {team.members.length ? <ul className="mt-2 space-y-2">{team.members.map(({ user }) => <li key={user.id} className="rounded-lg bg-muted/50 px-3 py-2">{user.displayName}</li>)}</ul> : <p className="mt-2 text-muted-foreground">No users assigned.</p>}
                </div>
                {canManage ? <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/projects/${projectId}/pilot/teams/${team.id}/edit`}>Edit</Link></Button><ArchivePilotRecordButton projectId={projectId} recordId={team.id} type="team" /></div> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Pilot capability scope</h2><p className="text-sm text-muted-foreground">Canonical capabilities explicitly included in Pilot or deferred until after Pilot.</p></div>
        <div className="grid gap-4 xl:grid-cols-2">
          {capabilities.map((capability) => {
            const link = scope.capabilities.find(({ sharedCapabilityId }) => sharedCapabilityId === capability.id);
            return (
              <Card key={capability.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold text-muted-foreground">{capability.code}</p><CardTitle className="mt-1">{capability.name}</CardTitle></div>
                    <StatusBadge
                      status={link?.disposition === "INCLUDED" ? "completed" : "not-started"}
                      label={
                        link?.disposition === "INCLUDED"
                          ? "Included in Pilot"
                          : link?.disposition === "DEFERRED"
                            ? "Deferred after Pilot"
                            : "Not classified"
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {canManage ? (
                    <PilotCapabilityControl projectId={projectId} sharedCapabilityId={capability.id} initialDisposition={link?.disposition ?? "DEFERRED"} initialNotes={link?.notes ?? ""} />
                  ) : <p className="text-sm text-muted-foreground">{link?.notes ?? "No scope note."}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {(["ENTRY", "EXIT"] as const).map((type) => {
        const criteria = scope.criteria.filter((criterion) => criterion.type === type);
        return (
          <section key={type} className="space-y-4">
            <div className="flex items-center gap-3"><h2 className="text-xl font-semibold">{type === "ENTRY" ? "Entry criteria" : "Exit criteria"}</h2>{gateBadge(type === "ENTRY" ? readiness.entryGateStatus : readiness.exitGateStatus)}</div>
            <div className="grid gap-4 xl:grid-cols-2">
              {criteria.map((criterion) => (
                <Card key={criterion.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs font-semibold text-muted-foreground">{criterion.code} · {criterion.isRequired ? "Required" : "Optional"}</p><CardTitle className="mt-1">{criterion.title}</CardTitle></div>
                      <StatusBadge status={criterion.status === "MET" || criterion.status === "WAIVED" ? "completed" : criterion.status === "NOT_MET" ? "blocked" : "not-started"} label={displayEnum(criterion.status)} />
                    </div>
                    <CardDescription>{criterion.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {criterion.evidence ? <p className="rounded-lg bg-muted/50 p-3 text-sm"><span className="font-semibold">Evidence: </span>{criterion.evidence}</p> : null}
                    {criterion.reviewer ? <p className="text-xs text-muted-foreground">Reviewed by {criterion.reviewer.displayName} · {formatDate(criterion.reviewedAt)}</p> : null}
                    <div className="flex gap-2">
                      {canManage ? <Button asChild size="sm" variant="outline"><Link href={`/projects/${projectId}/pilot/criteria/${criterion.id}/edit`}>Edit definition</Link></Button> : null}
                    </div>
                    {canReview ? <PilotCriterionReviewForm projectId={projectId} criterionId={criterion.id} /> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Pilot issue log</h2><p className="text-sm text-muted-foreground">Open blockers, limitations discovered during Pilot, and their resolution ownership.</p></div>
        {!scope.issues.length ? <EmptyState icon={AlertTriangle} title="No Pilot issues" description="No issues have been recorded for this Pilot." /> : (
          <div className="grid gap-4 xl:grid-cols-2">
            {scope.issues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle>{issue.title}</CardTitle><CardDescription className="mt-1">{issue.description}</CardDescription></div>
                    <RiskBadge level={issue.severity.toLowerCase() as "low" | "medium" | "high" | "critical"} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={issue.status === "RESOLVED" || issue.status === "CLOSED" ? "completed" : issue.isBlocking ? "blocked" : "in-progress"} label={displayEnum(issue.status)} />
                    {issue.isBlocking ? <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">Blocks readiness</span> : null}
                  </div>
                  <p><span className="text-muted-foreground">Owner / Due:</span> {issue.owner?.displayName ?? "Unassigned"} · {formatDate(issue.dueDate)}</p>
                  <p><span className="font-semibold">Mitigation: </span>{issue.mitigation ?? "Not recorded"}</p>
                  {canManage ? <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/projects/${projectId}/pilot/issues/${issue.id}/edit`}>Edit</Link></Button><ArchivePilotRecordButton projectId={projectId} recordId={issue.id} type="issue" /></div> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Business sign-off</CardTitle><CardDescription>Business acceptance of Pilot outcomes and limitations.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">{reviewBadge(scope.businessSignOffStatus)}<span className="text-xs text-muted-foreground">{scope.businessSignOffBy?.displayName ?? "Not reviewed"}</span></div>
            {canReview ? <PilotSignOffReviewForm projectId={projectId} signOff="BUSINESS" /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Technical sign-off</CardTitle><CardDescription>Technical acceptance of support, rollback and release evidence.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">{reviewBadge(scope.technicalSignOffStatus)}<span className="text-xs text-muted-foreground">{scope.technicalSignOffBy?.displayName ?? "Not reviewed"}</span></div>
            {canReview ? <PilotSignOffReviewForm projectId={projectId} signOff="TECHNICAL" /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Final Pilot decision</CardTitle><CardDescription>Approval is rejected server-side until readiness conditions are satisfied.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge status={scope.finalDecisionStatus === "APPROVED" ? "completed" : scope.finalDecisionStatus === "REJECTED" ? "blocked" : "not-started"} label={displayEnum(scope.finalDecisionStatus)} />
            {scope.finalDecision ? <p className="text-sm">{scope.finalDecision}</p> : null}
            {canReview ? <FinalPilotDecisionForm projectId={projectId} /> : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Approval and rejection history</CardTitle><CardDescription>Immutable audit records for criteria, sign-offs, and final decisions.</CardDescription></CardHeader>
        <CardContent>
          {approvalHistory.length ? (
            <ol className="space-y-3">
              {approvalHistory.map((entry) => (
                <li key={entry.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                  <p className="font-medium">{displayEnum(entry.action.replace("pilot.", ""))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.actor?.displayName ?? "System"} · {formatDate(entry.createdAt)}</p>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted-foreground">No Pilot approvals or rejections recorded yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
