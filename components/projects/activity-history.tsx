import { History } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

const actionLabels: Record<string, string> = {
  "project.created": "created the project",
  "project.updated": "updated the project",
  "project.archived": "archived the project",
  "project.membership_set": "updated project membership",
  "project.membership_archived": "removed project membership",
  "access.project_membership_set": "updated project membership",
  "milestone.created": "created a milestone",
  "milestone.updated": "updated a milestone",
  "milestone.archived": "archived a milestone",
  "milestone.reordered": "reordered milestones",
  "work_item.created": "created a Work Item",
  "work_item.updated": "updated a Work Item",
  "work_item.execution_updated": "updated assigned Work Item execution",
  "work_item.archived": "archived a Work Item",
  "shared_capability.created": "created a Shared Capability",
  "shared_capability.updated": "updated a Shared Capability",
  "shared_capability.execution_updated":
    "updated assigned Shared Capability execution",
  "shared_capability.archived": "archived a Shared Capability",
  "risk.created": "created a Risk",
  "risk.updated": "updated a Risk",
  "risk.archived": "archived a Risk",
  "decision.created": "created a Decision",
  "decision.updated": "updated a Decision",
  "decision.reviewed": "recorded a Decision review",
  "decision.comment_added": "commented on a Decision",
  "decision.archived": "archived a Decision",
  "pilot.scope_created": "created the Controlled Pilot workspace",
  "pilot.scope_updated": "updated the Controlled Pilot overview",
  "pilot.team_created": "created a Pilot team",
  "pilot.team_updated": "updated a Pilot team",
  "pilot.team_archived": "archived a Pilot team",
  "pilot.capability_set": "updated Pilot capability scope",
  "pilot.criterion_created": "created a Pilot criterion",
  "pilot.criterion_updated": "updated a Pilot criterion",
  "pilot.criterion_reviewed": "reviewed a Pilot criterion",
  "pilot.issue_created": "created a Pilot issue",
  "pilot.issue_updated": "updated a Pilot issue",
  "pilot.issue_archived": "archived a Pilot issue",
  "pilot.business_sign_off_reviewed": "reviewed business Pilot sign-off",
  "pilot.technical_sign_off_reviewed": "reviewed technical Pilot sign-off",
  "pilot.final_decision_reviewed": "recorded the final Pilot decision",
};

export function ActivityHistory({
  entries,
}: {
  entries: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actor: { displayName: string; email: string } | null;
  }>;
}) {
  if (!entries.length) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Project, delivery, Risk, and Decision changes will appear here."
        className="min-h-48"
      />
    );
  }

  return (
    <ol className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold">
                {entry.actor?.displayName ?? "System"}
              </span>{" "}
              {actionLabels[entry.action] ?? entry.action}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC
              {" · "}
              {entry.entityType}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
