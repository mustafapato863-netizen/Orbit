import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarClock,
  CircleCheck,
  CircleGauge,
  Flag,
  ShieldAlert,
  TriangleAlert,
  Users,
} from "lucide-react";

import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type RoadmapItem =
  DeliveryPipelineView["roadmapGroups"][number]["items"][number];

type HealthTone = "on-track" | "at-risk" | "attention";

function isFinished(status: string) {
  return ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status);
}

function itemHasRisk(item: RoadmapItem) {
  return (
    item.status === "AT_RISK" ||
    item.status === "BLOCKED" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function dateLabel(value: Date | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function statusToneClass(tone: HealthTone) {
  if (tone === "on-track") return "bg-[#e3f7eb] text-[#12793f]";
  if (tone === "at-risk") return "bg-[#fdf1dd] text-[#b96a05]";
  return "bg-[#fde9e7] text-[#c8362b]";
}

export function ProjectExecutiveSnapshot({
  pipeline,
}: {
  pipeline: DeliveryPipelineView;
}) {
  const groups = pipeline.roadmapGroups;
  const items = [
    ...new Map(
      groups
        .flatMap(({ items: groupItems }) => groupItems)
        .map((item) => [`${item.itemKind}:${item.id}`, item]),
    ).values(),
  ];
  const activeItems = items.filter(({ status }) => !isFinished(status));
  const overdueItems = activeItems.filter(
    ({ dueDate }) => dueDate && dueDate.getTime() < pipeline.asOfDate.getTime(),
  );
  const riskItems = activeItems.filter(itemHasRisk);
  const blockedItems = activeItems.filter(({ status, blocker }) =>
    status === "BLOCKED" || Boolean(blocker?.trim()),
  );
  const unassignedItems = activeItems.filter(({ owner }) => !owner);
  const assignedOwners = new Set(
    activeItems.flatMap(({ owner }) => (owner ? [owner.id] : [])),
  );

  const currentPhase =
    groups
      .filter(({ progress }) => progress > 0 && progress < 100)
      .sort(
        (left, right) =>
          Number(right.riskLevel === "HIGH" || right.riskLevel === "CRITICAL") -
            Number(left.riskLevel === "HIGH" || left.riskLevel === "CRITICAL") ||
          (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
            (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
      )[0] ??
    groups.find(({ progress }) => progress < 100) ??
    groups.at(-1);

  const upcomingMilestone = groups
    .filter(
      ({ progress, dueDate }) =>
        progress < 100 &&
        dueDate &&
        dueDate.getTime() >= pipeline.asOfDate.getTime(),
    )
    .sort(
      (left, right) =>
        left.dueDate!.getTime() - right.dueDate!.getTime(),
    )[0];

  const overallProgress = average(items.map(({ progress }) => progress));
  const cards: Array<{
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: string;
  }> = [
    {
      label: "Overall Progress",
      value: `${overallProgress}%`,
      detail: `${items.length} active and completed items`,
      icon: CircleGauge,
      tone: "bg-[#efebff] text-[#6350c9]",
    },
    {
      label: "Current Phase",
      value: currentPhase?.code ?? "Not set",
      detail: currentPhase?.name ?? "Add the first project phase",
      icon: Activity,
      tone: "bg-[#e8f0fe] text-[#2559bd]",
    },
    {
      label: "Upcoming Milestone",
      value: upcomingMilestone
        ? dateLabel(upcomingMilestone.dueDate)
        : "None scheduled",
      detail: upcomingMilestone?.name ?? "No upcoming phase deadline",
      icon: Flag,
      tone: "bg-[#e3f8f4] text-[#0c8e7e]",
    },
    {
      label: "Overdue Items",
      value: String(overdueItems.length),
      detail: overdueItems.length ? "Require schedule attention" : "Schedule is clear",
      icon: CalendarClock,
      tone: overdueItems.length
        ? "bg-[#fdf1dd] text-[#b96a05]"
        : "bg-[#e3f7eb] text-[#12793f]",
    },
    {
      label: "Active Risks",
      value: String(riskItems.length),
      detail: blockedItems.length
        ? `${blockedItems.length} currently blocked`
        : "No blocked items",
      icon: ShieldAlert,
      tone: riskItems.length
        ? "bg-[#fde9e7] text-[#c8362b]"
        : "bg-[#e3f7eb] text-[#12793f]",
    },
    {
      label: "Team Capacity",
      value: `${assignedOwners.size} assigned`,
      detail: unassignedItems.length
        ? `${unassignedItems.length} items need an owner`
        : "All active items have owners",
      icon: Users,
      tone: unassignedItems.length
        ? "bg-[#fdf1dd] text-[#b96a05]"
        : "bg-[#e3f7eb] text-[#12793f]",
    },
  ];

  const scheduleTone: HealthTone = overdueItems.length ? "at-risk" : "on-track";
  const scopeTone: HealthTone = blockedItems.length ? "attention" : "on-track";
  const qualityTone: HealthTone = riskItems.length ? "at-risk" : "on-track";
  const resourcesTone: HealthTone = unassignedItems.length
    ? "attention"
    : "on-track";
  const overallTone: HealthTone = [scopeTone, scheduleTone, qualityTone, resourcesTone].includes(
    "attention",
  )
    ? "attention"
    : [scopeTone, scheduleTone, qualityTone, resourcesTone].includes("at-risk")
      ? "at-risk"
      : "on-track";

  const healthItems: Array<{ label: string; tone: HealthTone; value: string }> = [
    { label: "Scope", tone: scopeTone, value: scopeTone === "on-track" ? "On Track" : "Needs Attention" },
    { label: "Schedule", tone: scheduleTone, value: scheduleTone === "on-track" ? "On Track" : "At Risk" },
    { label: "Quality", tone: qualityTone, value: qualityTone === "on-track" ? "On Track" : "At Risk" },
    { label: "Resources", tone: resourcesTone, value: resourcesTone === "on-track" ? "On Track" : "Needs Attention" },
    { label: "Overall", tone: overallTone, value: overallTone === "on-track" ? "On Track" : overallTone === "at-risk" ? "At Risk" : "Needs Attention" },
  ];

  const healthReason = overdueItems.length
    ? `Schedule needs attention because ${overdueItems.length} active ${overdueItems.length === 1 ? "item is" : "items are"} overdue.`
    : blockedItems.length
      ? `Scope needs attention because ${blockedItems.length} active ${blockedItems.length === 1 ? "item is" : "items are"} blocked.`
      : unassignedItems.length
        ? `${unassignedItems.length} active ${unassignedItems.length === 1 ? "item needs" : "items need"} an assigned owner.`
        : "Scope, schedule, quality, and resource ownership are currently on track.";

  return (
    <div className="space-y-3">
      <section aria-labelledby="executive-project-snapshot-heading">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="executive-project-snapshot-heading" className="orbit-panel-title">
            Executive project snapshot
            </h2>
            <p className="orbit-panel-subtitle">
              Progress, timing, risk, and ownership at a glance.
            </p>
          </div>
          <p className="text-[0.68rem] font-semibold text-[var(--orbit-text-subtle)]">
            Based on {items.length} project items
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map(({ label, value, detail, icon: Icon, tone }) => (
            <article
              key={label}
              className="orbit-panel flex min-h-[92px] items-start gap-3 p-3.5"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  tone,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.63rem] font-bold uppercase tracking-[0.045em] text-[var(--orbit-text-subtle)]">
                  {label}
                </p>
                <strong className="mt-1 block truncate text-[1.1rem] font-extrabold leading-tight text-[var(--orbit-text)]">
                  {value}
                </strong>
                <p className="mt-0.5 line-clamp-2 text-[0.66rem] leading-4 text-[var(--orbit-text-muted)]">
                  {detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="project-health-heading"
        className="orbit-panel px-4 py-3.5 sm:px-5"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                statusToneClass(overallTone),
              )}
            >
              {overallTone === "on-track" ? (
                <CircleCheck className="size-4" aria-hidden="true" />
              ) : (
                <TriangleAlert className="size-4" aria-hidden="true" />
              )}
            </span>
            <div>
              <h2 id="project-health-heading" className="orbit-panel-title">
                Project health
              </h2>
              <p className="mt-0.5 max-w-3xl text-[0.74rem] leading-5 text-[var(--orbit-text-muted)]">
                {healthReason}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {healthItems.map(({ label, tone, value }) => (
              <div
                key={label}
                className="min-w-[106px] rounded-lg border border-[var(--orbit-border-soft)] bg-[#fafbfc] px-2.5 py-2"
              >
                <dt className="text-[0.61rem] font-bold uppercase tracking-[0.05em] text-[var(--orbit-text-subtle)]">
                  {label}
                </dt>
                <dd
                  className={cn(
                    "mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.62rem] font-bold",
                    statusToneClass(tone),
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
