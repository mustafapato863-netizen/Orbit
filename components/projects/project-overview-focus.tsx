import Link from "next/link";
import { ArrowRight, CalendarClock, CircleAlert, ListChecks, ShieldAlert } from "lucide-react";

import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type RoadmapItem = DeliveryPipelineView["roadmapGroups"][number]["items"][number];

function dateLabel(value: Date | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function itemNeedsAttention(item: RoadmapItem, asOfDate: Date) {
  return (
    item.status === "BLOCKED" ||
    item.status === "AT_RISK" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL" ||
    (item.dueDate !== null && item.dueDate.getTime() < asOfDate.getTime() && item.progress < 100)
  );
}

export function ProjectOverviewFocus({
  pipeline,
  projectId,
}: {
  pipeline: DeliveryPipelineView;
  projectId: string;
}) {
  const items = [
    ...new Map(
      pipeline.roadmapGroups
        .flatMap(({ items: groupItems }) => groupItems)
        .map((item) => [`${item.itemKind}:${item.id}`, item]),
    ).values(),
  ];
  const attentionItems = items
    .filter((item) => itemNeedsAttention(item, pipeline.asOfDate))
    .sort(
      (left, right) =>
        Number(right.status === "BLOCKED") - Number(left.status === "BLOCKED") ||
        (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 3);
  const nextEvents = pipeline.nextEvents.slice(0, 3);

  return (
    <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Management focus">
      <article className="orbit-panel overflow-hidden">
        <div className="orbit-panel-head">
          <div>
            <h2 className="orbit-panel-title">Management focus</h2>
            <p className="orbit-panel-subtitle">Items that need a decision, owner, or delivery follow-up.</p>
          </div>
          <Link
            href={`/projects/${projectId}/risks`}
            className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] font-bold text-[#6350c9] transition-colors hover:text-[#4c3ab8]"
          >
            Open risks <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-[var(--orbit-border-soft)]">
          {attentionItems.length ? (
            attentionItems.map((item) => {
              const overdue = item.dueDate && item.dueDate.getTime() < pipeline.asOfDate.getTime() && item.progress < 100;
              const isBlocked = item.status === "BLOCKED";
              return (
                <div key={`${item.itemKind}:${item.id}`} className="flex min-h-15 items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      isBlocked ? "bg-[#fdebea] text-[#c8362b]" : "bg-[#fdf1dd] text-[#b96a05]",
                    )}
                  >
                    {isBlocked ? <CircleAlert className="size-4" /> : <ShieldAlert className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.78rem] font-bold text-[var(--orbit-text)]">{item.name}</p>
                    <p className="mt-0.5 text-[0.67rem] text-[var(--orbit-text-muted)]">
                      {isBlocked ? "Blocked" : overdue ? "Overdue" : "At risk"}
                      {item.dueDate ? ` · Due ${dateLabel(item.dueDate)}` : ""}
                    </p>
                  </div>
                  <span className="text-[0.72rem] font-extrabold text-[var(--orbit-text-muted)]">{item.progress}%</span>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-28 items-center gap-3 px-4 py-4 sm:px-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#e3f7eb] text-[#12793f]">
                <ShieldAlert className="size-4" />
              </span>
              <p className="text-[0.75rem] text-[var(--orbit-text-muted)]">No active delivery items currently need management attention.</p>
            </div>
          )}
        </div>
      </article>

      <article className="orbit-panel overflow-hidden">
        <div className="orbit-panel-head">
          <div>
            <h2 className="orbit-panel-title">Next on the timeline</h2>
            <p className="orbit-panel-subtitle">Nearest starts, checks, and delivery gates.</p>
          </div>
          <Link
            href={`/projects/${projectId}/pipeline`}
            className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] font-bold text-[#6350c9] transition-colors hover:text-[#4c3ab8]"
          >
            View timeline <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <ol className="divide-y divide-[var(--orbit-border-soft)]">
          {nextEvents.length ? (
            nextEvents.map((event) => (
              <li key={event.code} className="flex min-h-15 items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#efebff] text-[#6350c9]">
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.78rem] font-bold text-[var(--orbit-text)]">{event.label}</p>
                  <p className="mt-0.5 truncate text-[0.67rem] text-[var(--orbit-text-muted)]">{event.packageName}</p>
                </div>
                <time className="shrink-0 text-[0.7rem] font-extrabold text-[var(--orbit-text-muted)]">{dateLabel(event.date)}</time>
              </li>
            ))
          ) : (
            <li className="flex min-h-28 items-center gap-3 px-4 py-4 sm:px-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#eef0f4] text-[#656e82]">
                <ListChecks className="size-4" />
              </span>
              <p className="text-[0.75rem] text-[var(--orbit-text-muted)]">Add dates to project items to populate the delivery timeline.</p>
            </li>
          )}
        </ol>
      </article>
    </section>
  );
}
