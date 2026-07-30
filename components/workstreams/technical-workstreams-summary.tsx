import {
  Boxes,
  FileText,
  Layers3,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";

type RoadmapItem =
  DeliveryPipelineView["roadmapGroups"][number]["items"][number];

type WorkstreamSummaryData = {
  code: string;
  name: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  ringBg: string;
  ringStroke: string;
  uniqueTasks: number;
  blockers: number;
  avgProgress: number;
  owner: string;
  upcoming: Array<{ name: string; date: string }>;
};

const completedStatuses = new Set(["COMPLETED", "CANCELLED", "ARCHIVED"]);
const fallbackWorkstreamNames: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
};
const visualPresets = [
  {
    icon: Route,
    iconBg: "bg-[#efebff]",
    iconColor: "text-[#6350c9]",
    ringBg: "#efebff",
    ringStroke: "#6e5ae6",
  },
  {
    icon: Layers3,
    iconBg: "bg-[#e8f0fe]",
    iconColor: "text-[#2559bd]",
    ringBg: "#e8f0fe",
    ringStroke: "#2f6fe4",
  },
  {
    icon: Boxes,
    iconBg: "bg-[#e3f8f4]",
    iconColor: "text-[#0c8e7e]",
    ringBg: "#e3f8f4",
    ringStroke: "#0e9f8e",
  },
  {
    icon: Users,
    iconBg: "bg-[#fdf1dd]",
    iconColor: "text-[#b96a05]",
    ringBg: "#fdf1dd",
    ringStroke: "#e8890c",
  },
] as const;

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function mostCommonOwner(items: RoadmapItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.owner?.displayName) continue;
    counts.set(item.owner.displayName, (counts.get(item.owner.displayName) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Unassigned";
}

export function ProjectWorkstreamsSummary({
  pipeline,
}: {
  pipeline: DeliveryPipelineView;
}) {
  const allItems = [
    ...new Map(
      pipeline.roadmapGroups
        .flatMap(({ items }) => items ?? [])
        .filter((item): item is RoadmapItem => Boolean(item))
        .map((item) => [`${item.itemKind}:${item.id}`, item]),
    ).values(),
  ];

  const workstreamNames = new Map<string, string>();
  for (const item of allItems) {
    workstreamNames.set(
      item.primaryWorkstream.code,
      item.primaryWorkstream.name ??
        fallbackWorkstreamNames[item.primaryWorkstream.code] ??
        item.primaryWorkstream.code,
    );
    for (const { workstream } of item.supportingWorkstreams ?? []) {
      workstreamNames.set(
        workstream.code,
        workstream.name ??
          fallbackWorkstreamNames[workstream.code] ??
          workstream.code,
      );
    }
  }

  const workstreams: WorkstreamSummaryData[] = [...workstreamNames.entries()]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([code, name], index) => {
      const matched = allItems.filter(
        (item) =>
          item.primaryWorkstream.code === code ||
          (item.supportingWorkstreams ?? []).some(
            ({ workstream }) => workstream.code === code,
          ),
      );
      const blockers = matched.filter(
        (item) =>
          item.status === "BLOCKED" ||
          item.status === "AT_RISK" ||
          item.riskLevel === "HIGH" ||
          item.riskLevel === "CRITICAL",
      ).length;
      const avgProgress = matched.length
        ? Math.round(
            matched.reduce((total, item) => total + item.progress, 0) /
              matched.length,
          )
        : 0;
      const preset = visualPresets[index % visualPresets.length]!;

      return {
        code,
        name,
        ...preset,
        uniqueTasks: matched.filter(
          (item) => !completedStatuses.has(String(item.status)),
        ).length,
        blockers,
        avgProgress,
        owner: mostCommonOwner(
          matched.filter((item) => item.primaryWorkstream.code === code),
        ),
        upcoming: matched
          .filter(
            (item) =>
              item.dueDate && !completedStatuses.has(String(item.status)),
          )
          .sort(
            (left, right) =>
              left.dueDate!.getTime() - right.dueDate!.getTime(),
          )
          .slice(0, 2)
          .map((item) => ({
            name: item.name,
            date: dateLabel(item.dueDate!),
          })),
      };
    });

  return (
    <section id="project-workstreams" aria-labelledby="project-workstreams-heading">
      <div className="mb-3">
        <h2
          id="project-workstreams-heading"
          className="m-0 text-[16px] font-bold text-[var(--orbit-text)]"
        >
          Project workstreams
        </h2>
        <p className="m-0 mt-0.5 text-[12px] text-[var(--orbit-text-subtle)]">
          Live ownership and delivery health across the project&apos;s configured workstreams.
        </p>
      </div>

      {workstreams.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workstreams.map((workstream) => {
            const Icon = workstream.icon;
            const circumference = 150.8;
            const strokeDashoffset =
              circumference -
              (circumference * workstream.avgProgress) / 100;

            return (
              <article
                key={workstream.code}
                aria-label={`${workstream.name} workstream summary`}
                className="group rounded-xl border border-[var(--orbit-border)] bg-white p-4 shadow-[var(--orbit-shadow-xs)] transition-[border-color,box-shadow] duration-200 hover:border-[#d8d3ff] hover:shadow-[var(--orbit-shadow-sm)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-[9px] ${workstream.iconBg} ${workstream.iconColor}`}
                    >
                      <Icon className="size-[17px]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-bold text-[var(--orbit-text)]">
                        {workstream.name}
                      </h3>
                      <p className="truncate text-[10.5px] text-[var(--orbit-text-subtle)]">
                        Owner: {workstream.owner}
                      </p>
                    </div>
                  </div>

                  <div className="relative size-[56px] shrink-0">
                    <svg
                      viewBox="0 0 56 56"
                      className="size-[56px] -rotate-90"
                      aria-hidden="true"
                    >
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke={workstream.ringBg}
                        strokeWidth="6"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke={workstream.ringStroke}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-[var(--orbit-text)]">
                      {workstream.avgProgress}%
                    </div>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-[#fafbfc] px-3 py-2.5">
                  <div>
                    <dt className="text-[10.5px] font-semibold text-[var(--orbit-text-subtle)]">
                      Open items
                    </dt>
                    <dd className="text-[16px] font-extrabold text-[var(--orbit-text)]">
                      {workstream.uniqueTasks}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold text-[var(--orbit-text-subtle)]">
                      Blockers
                    </dt>
                    <dd
                      className={`text-[16px] font-extrabold ${
                        workstream.blockers
                          ? "text-[#c8362b]"
                          : "text-[var(--orbit-text)]"
                      }`}
                    >
                      {workstream.blockers}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-semibold text-[var(--orbit-text-subtle)]">
                      Health
                    </dt>
                    <dd
                      className={`mt-1 text-[10.5px] font-bold ${
                        workstream.blockers
                          ? "text-[#b96a05]"
                          : "text-[#12793f]"
                      }`}
                    >
                      {workstream.blockers ? "At Risk" : "On Track"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-[var(--orbit-border-soft)] pt-3">
                  <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--orbit-text-subtle)]">
                    Next due item
                  </div>
                  <div className="space-y-1.5">
                    {workstream.upcoming.map((item) => (
                      <div
                        key={`${item.name}:${item.date}`}
                        className="flex items-center justify-between text-[12.5px]"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-[var(--orbit-text-muted)]">
                          <FileText className="size-[13px] shrink-0 text-[var(--orbit-text-subtle)]" />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="shrink-0 text-[11.5px] font-semibold text-[var(--orbit-text-subtle)]">
                          {item.date}
                        </span>
                      </div>
                    ))}
                    {!workstream.upcoming.length ? (
                      <p className="text-[12px] text-[var(--orbit-text-subtle)]">
                        No upcoming items
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="orbit-panel p-5 text-sm text-[var(--orbit-text-muted)]">
          Workstream cards will appear when project items are assigned to a workstream.
        </div>
      )}
    </section>
  );
}

export const TechnicalWorkstreamsSummary = ProjectWorkstreamsSummary;
