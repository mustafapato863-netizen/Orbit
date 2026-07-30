import { AlertTriangle, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveGovernanceButton } from "@/components/governance/archive-governance-button";
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
import { governanceQueries } from "@/lib/governance/governance.service";
import { displayEnum } from "@/lib/projects/project.utils";

function date(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(value)
    : "Not set";
}

export default async function RisksAndDecisionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, risks, decisions] = await Promise.all([
    governanceQueries.getProject(projectId),
    governanceQueries.listRisks(projectId),
    governanceQueries.listDecisions(projectId),
  ]);
  if (!project) notFound();
  const canManageRisks = hasPermission(context.user, PERMISSIONS.RISK_MANAGE);
  const canManageDecisions = hasPermission(context.user, PERMISSIONS.DECISION_MANAGE);
  const canReview = hasPermission(context.user, PERMISSIONS.DECISION_REVIEW);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} / Governance`}
        title="Risks & Decisions"
        description="Management attention, mitigation ownership and traceable decision outcomes in one project-scoped register."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageRisks ? <Button asChild variant="outline"><Link href={`/projects/${projectId}/risks/new`}><Plus />Add Risk</Link></Button> : null}
            {canManageDecisions ? <Button asChild><Link href={`/projects/${projectId}/decisions/new`}><Plus />Add Decision</Link></Button> : null}
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Risks" value={risks.filter(({ status }) => status !== "CLOSED").length} icon={AlertTriangle} tone="amber" />
        <MetricCard label="High / Critical" value={risks.filter(({ severity }) => ["HIGH", "CRITICAL"].includes(severity)).length} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Pending Decisions" value={decisions.filter(({ status }) => status === "PENDING").length} icon={Scale} tone="purple" />
        <MetricCard label="Overdue decisions" value={decisions.filter(({ requiredBy, status }) => requiredBy && requiredBy < new Date() && status === "PENDING").length} icon={Scale} tone="amber" />
      </section>

      <section className="space-y-4" aria-labelledby="risk-register-heading">
        <div>
          <h2 id="risk-register-heading" className="text-xl font-semibold">Risk register</h2>
          <p className="text-sm text-muted-foreground">Severity is derived from Probability × Impact.</p>
        </div>
        {!risks.length ? (
          <EmptyState icon={AlertTriangle} title="No active Risks" description="There are no project Risks in the active register." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {risks.map((risk) => (
              <Card key={risk.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle>{risk.title}</CardTitle><CardDescription className="mt-2">{risk.description}</CardDescription></div>
                    <RiskBadge level={risk.severity.toLowerCase() as "low" | "medium" | "high" | "critical"} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted-foreground">Probability / Impact</dt><dd className="font-medium">{risk.probability} / 5 · {risk.impact} / 5</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="font-medium">{displayEnum(risk.status)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Milestone</dt><dd>{risk.milestone?.name ?? "Project-level"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Related work</dt><dd>{risk.workItem?.name ?? risk.sharedCapability?.name ?? "None"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Primary Workstream</dt><dd>{risk.primaryWorkstream?.name ?? "Cross-workstream"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Owner / Due</dt><dd>{risk.owner?.displayName ?? "Unassigned"} · {date(risk.dueDate)}</dd></div>
                  </dl>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm"><span className="font-semibold">Mitigation: </span>{risk.mitigation ?? "Not recorded"}</div>
                  {canManageRisks ? <div className="flex items-center gap-2"><Button asChild size="sm" variant="outline"><Link href={`/projects/${projectId}/risks/${risk.id}/edit`}>Edit</Link></Button><ArchiveGovernanceButton projectId={projectId} entityId={risk.id} entity="risk" /></div> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="decision-log-heading">
        <div><h2 id="decision-log-heading" className="text-xl font-semibold">Decision log</h2><p className="text-sm text-muted-foreground">Required decisions with affected Workstreams, comments and an audited change history.</p></div>
        {!decisions.length ? (
          <EmptyState icon={Scale} title="No Decisions" description="There are no active Decisions for this project." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {decisions.map((decision) => (
              <Card key={decision.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle>{decision.title}</CardTitle><CardDescription className="mt-2">{decision.description}</CardDescription></div>
                    <StatusBadge status={decision.status === "APPROVED" ? "completed" : decision.status === "REJECTED" ? "blocked" : decision.status === "PENDING" ? "not-started" : "at-risk"} label={displayEnum(decision.status)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted-foreground">Related Milestone</dt><dd>{decision.milestone?.name ?? "Project-level"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Required by</dt><dd>{date(decision.requiredBy)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Decision owner</dt><dd>{decision.owner?.displayName ?? "Unassigned"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Affected Workstreams</dt><dd>{decision.affectedWorkstreams.map(({ workstream }) => workstream.name).join(", ")}</dd></div>
                  </dl>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm"><span className="font-semibold">Recommended direction: </span>{decision.recommendedDirection ?? "Not recorded"}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/projects/${projectId}/decisions/${decision.id}/edit`}>{canManageDecisions ? "Edit & view history" : canReview ? "Review & view history" : "View history"}</Link></Button>
                    {canManageDecisions ? <ArchiveGovernanceButton projectId={projectId} entityId={decision.id} entity="decision" /> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
