"use client";

import { useMemo, useState } from "react";

import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type SummaryView = "phase" | "workstream" | "owner" | "status";
type RoadmapItem =
  DeliveryPipelineView["roadmapGroups"][number]["items"][number];

type SummaryRow = {
  key: string;
  code: string;
  name: string;
  owner: string;
  progress: number;
  startDate: Date | null;
  dueDate: Date | null;
  health: "On Track" | "At Risk" | "Blocked" | "Completed";
  deliverables: number;
  risks: number;
  phaseCode?: string;
};

const viewLabels: Record<SummaryView, string> = {
  phase: "By Phase",
  workstream: "By Workstream",
  owner: "By Owner",
  status: "By Status",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function minDate(values: Array<Date | null>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  return dates.length
    ? new Date(Math.min(...dates.map((date) => date.getTime())))
    : null;
}

function maxDate(values: Array<Date | null>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  return dates.length
    ? new Date(Math.max(...dates.map((date) => date.getTime())))
    : null;
}

function itemRisk(item: RoadmapItem) {
  return (
    item.status === "AT_RISK" ||
    item.status === "BLOCKED" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function healthFor(items: RoadmapItem[]): SummaryRow["health"] {
  if (items.some(({ status }) => status === "BLOCKED")) return "Blocked";
  if (items.some(itemRisk)) return "At Risk";
  if (
    items.length &&
    items.every(({ status }) =>
      ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status),
    )
  ) {
    return "Completed";
  }
  return "On Track";
}

function mostCommonOwner(items: RoadmapItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const name = item.owner?.displayName ?? "Unassigned";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Unassigned";
}

function rowFromItems(
  key: string,
  code: string,
  name: string,
  items: RoadmapItem[],
  owner = mostCommonOwner(items),
): SummaryRow {
  return {
    key,
    code,
    name,
    owner,
    progress: average(items.map(({ progress }) => progress)),
    startDate: minDate(items.map(({ startDate }) => startDate)),
    dueDate: maxDate(items.map(({ dueDate }) => dueDate)),
    health: healthFor(items),
    deliverables: items.length,
    risks: items.filter(itemRisk).length,
  };
}

function statusName(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PhaseSummaryTable({
  pipeline,
  onPhaseClick,
}: {
  pipeline: DeliveryPipelineView;
  viewMode?: "overall" | "business" | "technical";
  onPhaseClick?: (phaseCode: string) => void;
}) {
  const [summaryView, setSummaryView] = useState<SummaryView>("phase");
  const canonicalItems = useMemo(
    () => [
      ...new Map(
        pipeline.roadmapGroups
          .flatMap(({ items }) => items ?? [])
          .filter((item): item is RoadmapItem => Boolean(item))
          .map((item) => [`${item.itemKind}:${item.id}`, item]),
      ).values(),
    ],
    [pipeline.roadmapGroups],
  );

  const rows = useMemo<SummaryRow[]>(() => {
    if (summaryView === "phase") {
      return pipeline.roadmapGroups.map((group) => {
        const items = (group.items ?? []).filter(
          (item): item is RoadmapItem => Boolean(item),
        );
        return {
          ...rowFromItems(group.code, group.code, group.name, items),
          progress: group.progress,
          startDate: group.startDate,
          dueDate: group.dueDate,
          deliverables:
            (group.specificCount ?? 0) +
            (group.sharedCount ?? 0) ||
            items.length,
          phaseCode: group.code,
        };
      });
    }

    const buckets = new Map<string, { code: string; name: string; items: RoadmapItem[] }>();
    for (const item of canonicalItems) {
      const bucket =
        summaryView === "workstream"
          ? {
              code: item.primaryWorkstream.code,
              name: item.primaryWorkstream.name,
            }
          : summaryView === "owner"
            ? {
                code: item.owner?.id ?? "UNASSIGNED",
                name: item.owner?.displayName ?? "Unassigned",
              }
            : { code: item.status, name: statusName(item.status) };
      const current = buckets.get(bucket.code) ?? {
        ...bucket,
        items: [],
      };
      current.items.push(item);
      buckets.set(bucket.code, current);
    }

    return [...buckets.values()]
      .map(({ code, name, items }) =>
        rowFromItems(
          `${summaryView}:${code}`,
          code,
          name,
          items,
          summaryView === "owner" ? name : mostCommonOwner(items),
        ),
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [canonicalItems, pipeline.roadmapGroups, summaryView]);

  return (
    <section
      id="phase-delivery-summary"
      className="scroll-mt-5 mb-6 overflow-hidden rounded-xl border border-[var(--orbit-border)] bg-white shadow-[var(--orbit-shadow-xs)]"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--orbit-border-soft)] bg-[#121a2f] px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[0.78rem] font-extrabold uppercase tracking-[0.06em]">
            Phase delivery summary
          </h2>
          <p className="mt-0.5 text-[0.67rem] text-[#aeb6ce]">
            Review the same project by phase, workstream, owner, or status.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[0.68rem] font-semibold text-[#cbd1e0]">
          View
          <select
            value={summaryView}
            onChange={(event) => setSummaryView(event.target.value as SummaryView)}
            className="h-8 rounded-lg border border-white/15 bg-white px-2.5 text-[0.68rem] font-bold text-[#121a2f] outline-none focus:ring-2 focus:ring-[#8b7cf6]"
            aria-label="Phase delivery summary view"
          >
            {(Object.keys(viewLabels) as SummaryView[]).map((view) => (
              <option key={view} value={view}>
                {viewLabels[view]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--orbit-border)] bg-[#faf9fc] text-[10.5px] font-bold uppercase tracking-wider text-[var(--orbit-text-subtle)]">
              <th className="w-[95px] px-3 py-2">Group</th>
              <th className="min-w-[250px] px-3 py-2">Phase / Delivery Group</th>
              <th className="w-[150px] px-3 py-2">Owner</th>
              <th className="w-[110px] px-3 py-2 text-right">Progress</th>
              <th className="w-[105px] px-3 py-2">Start</th>
              <th className="w-[105px] px-3 py-2">Due</th>
              <th className="w-[105px] px-3 py-2">Health</th>
              <th className="w-[90px] px-3 py-2 text-right">Items</th>
              <th className="w-[70px] px-3 py-2 text-right">Risks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--orbit-border-soft)] text-[12px]">
            {rows.map((row) => {
              const interactive =
                summaryView === "phase" && Boolean(row.phaseCode) && Boolean(onPhaseClick);
              return (
                <tr
                  key={row.key}
                  className={cn(
                    "transition-colors",
                    interactive && "cursor-pointer hover:bg-[#f8f9fc]",
                  )}
                  onClick={() => {
                    if (interactive && row.phaseCode) onPhaseClick?.(row.phaseCode);
                  }}
                  onKeyDown={(event) => {
                    if (
                      interactive &&
                      row.phaseCode &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      onPhaseClick?.(row.phaseCode);
                    }
                  }}
                  tabIndex={interactive ? 0 : undefined}
                  role={interactive ? "button" : undefined}
                  aria-label={
                    interactive
                      ? `Jump to timeline for ${row.phaseCode}`
                      : undefined
                  }
                >
                  <td className="px-3 py-2.5">
                    <span className="inline-block max-w-[86px] truncate rounded bg-[#efebff] px-1.5 py-0.5 text-[10.5px] font-extrabold text-[#6350c9]">
                      {row.code}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-[#10131c]">
                    {row.name}
                  </td>
                  <td className="max-w-[150px] truncate px-3 py-2.5 text-[#5b6273]">
                    {row.owner}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="inline-block h-1.5 w-12 overflow-hidden rounded-full bg-[#eef0f4]">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            row.progress === 100
                              ? "bg-[#17924f]"
                              : row.health === "Blocked"
                                ? "bg-[#e4483c]"
                                : row.health === "At Risk"
                                  ? "bg-[#e8890c]"
                                  : "bg-[#6e5ae6]",
                          )}
                          style={{ width: `${row.progress}%` }}
                        />
                      </span>
                      <strong className="w-9 text-[11.5px]">{row.progress}%</strong>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#5b6273]">
                    {formatDate(row.startDate)}
                  </td>
                  <td className="px-3 py-2.5 text-[#5b6273]">
                    {formatDate(row.dueDate)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                        row.health === "Completed" &&
                          "bg-[#e3f7eb] text-[#12793f]",
                        row.health === "On Track" &&
                          "bg-[#e8f0fe] text-[#2559bd]",
                        row.health === "At Risk" &&
                          "bg-[#fdf1dd] text-[#b96a05]",
                        row.health === "Blocked" &&
                          "bg-[#fde9e7] text-[#c8362b]",
                      )}
                    >
                      {row.health}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold">
                    {row.deliverables}
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-bold", row.risks && "text-[#c8362b]")}>
                    {row.risks}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-sm text-[var(--orbit-text-muted)]"
                >
                  No phase delivery data is available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
