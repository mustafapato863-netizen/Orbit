import {
  Ban,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Gauge,
  Layers3,
  Link2,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { displayEnum } from "@/lib/projects/project.utils";
import type { WorkstreamView } from "@/lib/workstreams/workstreams";
import { cn } from "@/lib/utils";

function status(value: string): Status {
  if (value === "COMPLETED") return "completed";
  if (value === "BLOCKED") return "blocked";
  if (value === "AT_RISK") return "at-risk";
  if (value === "NOT_STARTED") return "not-started";
  return "in-progress";
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(value)
    : "No due date";
}

export function WorkstreamDashboard({ view }: { view: WorkstreamView }) {
  const metrics = view.metrics;
  return (
    <div className="space-y-6">
      <nav aria-label="Project workstreams" className="flex items-center gap-2">
        <Link
          href={`/projects/${view.project.id}/workstreams`}
          className="rounded-lg border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground shadow-xs transition-colors hover:text-foreground"
        >
          All workstreams
        </Link>
        <span className="rounded-lg bg-[#efebff] px-3 py-2 text-sm font-semibold text-[#6350c9]">
          {view.workstream.name}
        </span>
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Unique related items" value={metrics.unique} description="Canonical count for this workstream" icon={Layers3} tone="blue" />
        <MetricCard label="Primary items" value={metrics.primary} description="Owned by this workstream" icon={ListChecks} tone="green" />
        <MetricCard label="Supporting items" value={metrics.supporting} description="Contributing workstream role" icon={Link2} tone="purple" />
        <MetricCard label="Average derived progress" value={`${metrics.averageProgress}%`} description="Mean across unique related items" icon={Gauge} tone="amber" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed" value={metrics.completed} icon={CheckCircle2} tone="green" />
        <MetricCard label="In progress" value={metrics.inProgress} icon={CircleDot} tone="blue" />
        <MetricCard label="Blocked" value={metrics.blocked} icon={Ban} tone="amber" />
        <MetricCard label="Pending" value={metrics.pending} icon={CircleDashed} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Unique related items</CardTitle>
          </CardHeader>
          <CardContent>
            {!view.items.length ? (
              <EmptyState
                icon={Layers3}
                title="No related items"
                description="No work items or shared records currently reference this workstream."
              />
            ) : (
              <div className="divide-y">
                {view.items.map((item) => (
                  <article key={item.key} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.kind}
                          </span>
                          <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[0.6875rem] font-semibold">
                            {item.assignment}
                          </span>
                        </div>
                        <h3 className="mt-1 font-semibold">{item.name}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {item.milestoneNames.join(" · ") || "Project-wide capability"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <StatusBadge status={status(item.status)} />
                        <RiskBadge
                          level={item.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical"}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{displayEnum(item.deliveryStage)}</span>
                          <span className="font-semibold">{item.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                      <span className="text-muted-foreground">{formatDate(item.dueDate)}</span>
                      <span className={cn("font-medium", item.blocker && "text-destructive")}>
                        {item.blocker ? "Blocked" : "No blocker"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Upcoming due items</CardTitle></CardHeader>
            <CardContent>
              {view.upcomingDueItems.length ? (
                <ul className="space-y-3">
                  {view.upcomingDueItems.map((item) => (
                    <li key={item.key} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.dueDate)} · {item.assignment}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No active items have a due date.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Related Business Milestones</CardTitle></CardHeader>
            <CardContent>
              {view.relatedMilestones.length ? (
                <ul className="space-y-2 text-sm">
                  {view.relatedMilestones.map((name) => <li key={name} className="rounded-lg bg-muted/50 px-3 py-2">{name}</li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No related milestones.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Current blockers</CardTitle></CardHeader>
            <CardContent>
              {view.blockers.length ? (
                <ul className="space-y-3">
                  {view.blockers.map((item) => (
                    <li key={item.key} className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-900 dark:bg-red-950/30">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.blocker || "Status is Blocked; blocker details are not recorded."}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No current blockers.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
