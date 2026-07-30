import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Play,
} from "lucide-react";

import { pipelineStagePresentation } from "@/components/pipeline/pipeline-presentation";
import {
  overviewStageFor,
  type DeliveryPipelineView,
} from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type RoadmapGroup = DeliveryPipelineView["roadmapGroups"][number];
type RoadmapItem = RoadmapGroup["items"][number];

type ScheduledItem = {
  groupId: string;
  groupCode: string;
  groupName: string;
  item: RoadmapItem;
};

type ScheduleEvent = ScheduledItem & {
  date: Date;
  eventType: "start" | "due";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

function shortDate(value: Date | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function dayHeading(value: Date, today: Date) {
  const difference = Math.round(
    (startOfUtcDay(value).getTime() - today.getTime()) / DAY_MS,
  );
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function isFinished(status: string) {
  return ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status);
}

function isAtRisk(item: RoadmapItem) {
  return (
    item.status === "AT_RISK" ||
    item.status === "BLOCKED" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function itemPresentation(item: RoadmapItem) {
  const stage = overviewStageFor(item.deliveryStage);
  const presentation = pipelineStagePresentation[stage];
  if (item.status === "BLOCKED") {
    return {
      label: "Blocked",
      badge: "border-[#f2b8b5] bg-[#fde9e7] text-[#c8362b]",
      bar: "bg-[#dc3f35]",
    };
  }
  if (isAtRisk(item)) {
    return {
      label: "At Risk",
      badge: "border-[#f5d29a] bg-[#fdf1dd] text-[#b96a05]",
      bar: "bg-[#e8890c]",
    };
  }
  return {
    label: presentation.displayLabel,
    badge: cn("border-transparent", presentation.soft, presentation.text),
    bar: presentation.bar,
  };
}

function itemHref(projectId: string, scheduled: ScheduledItem) {
  if (scheduled.item.itemKind === "shared") {
    return `/projects/${projectId}/capabilities/${scheduled.item.id}/edit`;
  }
  return `/projects/${projectId}/milestones/${scheduled.groupId}/work-items/${scheduled.item.id}/edit`;
}

function canonicalItems(
  groups: DeliveryPipelineView["roadmapGroups"],
): ScheduledItem[] {
  return [
    ...new Map(
      groups.flatMap((group) =>
        group.items.map((item) => [
          `${item.itemKind}:${item.id}`,
          {
            groupId: group.id,
            groupCode: group.code,
            groupName: group.name,
            item,
          },
        ] as const),
      ),
    ).values(),
  ];
}

export function ProjectTimelineAgenda({
  pipeline,
  projectId,
}: {
  pipeline: DeliveryPipelineView;
  projectId: string;
}) {
  const today = startOfUtcDay(pipeline.asOfDate);
  const futureLimit = addDays(today, 30);
  const items = canonicalItems(pipeline.roadmapGroups);

  const activeNow = items
    .filter(({ item }) => {
      if (isFinished(item.status) || !item.startDate || !item.dueDate) return false;
      return (
        startOfUtcDay(item.startDate).getTime() <= today.getTime() &&
        startOfUtcDay(item.dueDate).getTime() >= today.getTime()
      );
    })
    .sort(
      (left, right) =>
        Number(isAtRisk(right.item)) - Number(isAtRisk(left.item)) ||
        left.item.dueDate!.getTime() - right.item.dueDate!.getTime(),
    );

  const events: ScheduleEvent[] = items
    .flatMap((scheduled) => {
      const itemEvents: ScheduleEvent[] = [];
      if (
        scheduled.item.startDate &&
        startOfUtcDay(scheduled.item.startDate).getTime() >= today.getTime() &&
        startOfUtcDay(scheduled.item.startDate).getTime() <= futureLimit.getTime()
      ) {
        itemEvents.push({
          ...scheduled,
          date: scheduled.item.startDate,
          eventType: "start",
        });
      }
      if (
        scheduled.item.dueDate &&
        !isFinished(scheduled.item.status) &&
        startOfUtcDay(scheduled.item.dueDate).getTime() <= futureLimit.getTime()
      ) {
        itemEvents.push({
          ...scheduled,
          date: scheduled.item.dueDate,
          eventType: "due",
        });
      }
      return itemEvents;
    })
    .sort(
      (left, right) =>
        left.date.getTime() - right.date.getTime() ||
        Number(left.eventType === "start") - Number(right.eventType === "start") ||
        left.item.name.localeCompare(right.item.name),
    );

  const overdueEvents = events
    .filter(
      (event) =>
        event.eventType === "due" &&
        startOfUtcDay(event.date).getTime() < today.getTime(),
    )
    .slice(-5);
  const upcomingEvents = events.filter(
    (event) => startOfUtcDay(event.date).getTime() >= today.getTime(),
  );
  const visibleEvents = [...overdueEvents, ...upcomingEvents];
  const eventGroups = [
    ...new Map(
      visibleEvents.map((event) => {
        const key = startOfUtcDay(event.date).toISOString();
        return [key, visibleEvents.filter((candidate) =>
          startOfUtcDay(candidate.date).toISOString() === key,
        )] as const;
      }),
    ).entries(),
  ];

  return (
    <section aria-labelledby="daily-plan-heading" className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="daily-plan-heading" className="orbit-panel-title">
            Daily delivery plan
          </h2>
          <p className="orbit-panel-subtitle">
            Work in progress today, followed by starts and due dates for the next 30 days.
          </p>
        </div>
        <span className="text-[0.68rem] font-semibold text-[var(--orbit-text-subtle)]">
          As of {shortDate(pipeline.asOfDate)}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]">
        <article className="orbit-panel overflow-hidden">
          <div className="orbit-panel-head">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#2559bd]">
                <CalendarClock className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[0.82rem] font-bold text-[var(--orbit-text)]">
                  Today&apos;s focus
                </h3>
                <p className="text-[0.67rem] text-[var(--orbit-text-subtle)]">
                  {activeNow.length} active {activeNow.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>

          {activeNow.length ? (
            <div className="divide-y divide-[var(--orbit-border-soft)]">
              {activeNow.slice(0, 8).map((scheduled) => {
                const presentation = itemPresentation(scheduled.item);
                return (
                  <Link
                    key={`${scheduled.item.itemKind}:${scheduled.item.id}`}
                    href={itemHref(projectId, scheduled)}
                    className="group grid gap-2 px-4 py-3 transition-colors hover:bg-[#fafbfc] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[0.75rem] font-bold text-[var(--orbit-text)]">
                          {scheduled.item.name}
                        </p>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[0.58rem] font-bold",
                            presentation.badge,
                          )}
                        >
                          {presentation.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[0.64rem] text-[var(--orbit-text-subtle)]">
                        {scheduled.groupCode} · {scheduled.groupName} ·{" "}
                        {scheduled.item.primaryWorkstream.name}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf0f4]">
                          <span
                            className={cn("block h-full rounded-full", presentation.bar)}
                            style={{ width: `${scheduled.item.progress}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[0.62rem] font-bold text-[var(--orbit-text-muted)]">
                          {scheduled.item.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[0.65rem] font-semibold text-[var(--orbit-text-muted)]">
                      <span>{shortDate(scheduled.item.startDate)}</span>
                      <ArrowRight className="size-3" aria-hidden="true" />
                      <span>{shortDate(scheduled.item.dueDate)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto size-6 text-[#17924f]" aria-hidden="true" />
              <p className="mt-2 text-[0.75rem] font-semibold text-[var(--orbit-text)]">
                No scheduled work is active today
              </p>
              <p className="mt-1 text-[0.67rem] text-[var(--orbit-text-subtle)]">
                Check the dated agenda for the next planned start.
              </p>
            </div>
          )}
        </article>

        <article className="orbit-panel max-h-[430px] overflow-hidden">
          <div className="orbit-panel-head">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#efebff] text-[#6350c9]">
                <CalendarDays className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[0.82rem] font-bold text-[var(--orbit-text)]">
                  Dated agenda
                </h3>
                <p className="text-[0.67rem] text-[var(--orbit-text-subtle)]">
                  {visibleEvents.length} scheduled starts and deadlines
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[370px] overflow-y-auto">
            {eventGroups.length ? (
              eventGroups.map(([dateKey, dayEvents]) => {
                const date = new Date(dateKey);
                const overdue = date.getTime() < today.getTime();
                return (
                  <div
                    key={dateKey}
                    className="grid grid-cols-[88px_minmax(0,1fr)] border-b border-[var(--orbit-border-soft)] last:border-b-0"
                  >
                    <div
                      className={cn(
                        "border-r border-[var(--orbit-border-soft)] px-3 py-3",
                        overdue ? "bg-[#fff7f5]" : "bg-[#fafbfc]",
                      )}
                    >
                      <p
                        className={cn(
                          "text-[0.68rem] font-extrabold",
                          overdue ? "text-[#c8362b]" : "text-[var(--orbit-text)]",
                        )}
                      >
                        {dayHeading(date, today)}
                      </p>
                      <p className="mt-0.5 text-[0.6rem] text-[var(--orbit-text-subtle)]">
                        {shortDate(date)}
                      </p>
                    </div>
                    <div className="divide-y divide-[var(--orbit-border-soft)]">
                      {dayEvents.map((event) => {
                        const presentation = itemPresentation(event.item);
                        const EventIcon =
                          event.eventType === "start"
                            ? Play
                            : overdue
                              ? AlertTriangle
                              : CircleDot;
                        return (
                          <Link
                            key={`${event.item.itemKind}:${event.item.id}:${event.eventType}`}
                            href={itemHref(projectId, event)}
                            className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-[#fafbfc]"
                          >
                            <EventIcon
                              className={cn(
                                "mt-0.5 size-3.5 shrink-0",
                                overdue
                                  ? "text-[#c8362b]"
                                  : event.eventType === "start"
                                    ? "text-[#0c8e7e]"
                                    : "text-[#6350c9]",
                              )}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-[0.7rem] font-bold text-[var(--orbit-text)]">
                                  {event.item.name}
                                </p>
                                <span className="shrink-0 text-[0.58rem] font-bold uppercase text-[var(--orbit-text-subtle)]">
                                  {event.eventType === "start" ? "Starts" : "Due"}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[0.61rem] text-[var(--orbit-text-subtle)]">
                                {presentation.label} · {event.item.progress}% ·{" "}
                                {event.item.primaryWorkstream.name}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-5 py-8 text-center text-[0.72rem] text-[var(--orbit-text-subtle)]">
                No dated starts or deadlines in the next 30 days.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
