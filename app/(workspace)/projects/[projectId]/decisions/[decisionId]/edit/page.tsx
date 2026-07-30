import { notFound } from "next/navigation";

import { DecisionForm } from "@/components/governance/decision-form";
import { DecisionCommentForm, DecisionReviewForm } from "@/components/governance/decision-interactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/policy";
import { governanceQueries } from "@/lib/governance/governance.service";
import { dateInputValue, displayEnum } from "@/lib/projects/project.utils";

function date(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; decisionId: string }>;
}) {
  const { projectId, decisionId } = await params;
  const context = await requirePagePermission(PERMISSIONS.PROJECT_VIEW, projectId);
  const [project, decision, setup, history] = await Promise.all([
    governanceQueries.getProject(projectId),
    governanceQueries.getDecision(projectId, decisionId),
    governanceQueries.getSetup(projectId),
    governanceQueries.listDecisionHistory(projectId, decisionId),
  ]);
  if (!project || !decision) notFound();
  const [workstreams, members, milestones] = setup;
  const canManage = hasPermission(context.user, PERMISSIONS.DECISION_MANAGE);
  const canReview = hasPermission(context.user, PERMISSIONS.DECISION_REVIEW);
  const canComment = canManage || canReview;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${project.code} / Decision`}
        title={decision.title}
        description="Project-scoped decision record with server-authorized review, comments and immutable audit history."
      />
      {canManage ? (
        <Card><CardHeader><CardTitle>Decision details</CardTitle></CardHeader><CardContent><DecisionForm
          projectId={projectId}
          decisionId={decisionId}
          setup={{ workstreams, members, milestones }}
          initialValues={{
            projectId,
            title: decision.title,
            description: decision.description,
            milestoneId: decision.milestoneId ?? "",
            affectedWorkstreamIds: decision.affectedWorkstreams.map(({ workstreamId }) => workstreamId),
            requiredBy: dateInputValue(decision.requiredBy),
            recommendedDirection: decision.recommendedDirection ?? "",
            ownerId: decision.ownerId ?? "",
            status: decision.status,
            decisionText: decision.decisionText ?? "",
          }}
        /></CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle>Decision record</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <p>{decision.description}</p>
          <p><span className="font-semibold">Status:</span> {displayEnum(decision.status)}</p>
          <p><span className="font-semibold">Recommended direction:</span> {decision.recommendedDirection ?? "Not recorded"}</p>
          <p><span className="font-semibold">Recorded decision:</span> {decision.decisionText ?? "Pending"}</p>
        </CardContent></Card>
      )}

      {canReview ? <Card><CardHeader><CardTitle>Reviewer decision</CardTitle></CardHeader><CardContent><DecisionReviewForm projectId={projectId} decisionId={decisionId} /></CardContent></Card> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Comment history</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {canComment ? <DecisionCommentForm projectId={projectId} decisionId={decisionId} /> : null}
            {decision.comments.length ? (
              <ol className="space-y-3">
                {decision.comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg border p-3 text-sm">
                    <p>{comment.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{comment.author?.displayName ?? "Former user"} · {date(comment.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">No comments recorded.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Decision change history</CardTitle></CardHeader>
          <CardContent>
            {history.length ? (
              <ol className="space-y-3">
                {history.map((entry) => (
                  <li key={entry.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                    <p className="font-medium">{displayEnum(entry.action.replace("decision.", ""))}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.actor?.displayName ?? "System"} · {date(entry.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">No changes recorded yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
