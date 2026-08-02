"use client";

import Link from "next/link";
import {
  ChevronDown,
  Filter,
  Pencil,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  GroupRoadmapSummary,
  canEditRoadmapItem,
  RoadmapItemEditor,
  TimelineLane,
  type RoadmapEditPermissions,
} from "@/components/pipeline/roadmap-row";
import {
  pipelineStagePresentation,
  workstreamPresentation,
} from "@/components/pipeline/pipeline-presentation";
import { Button } from "@/components/ui/button";
import type { DeliveryPipelineView } from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";

type RoadmapItem = DeliveryPipelineView["roadmapGroups"][number]["items"][number];
type RoadmapGroup = DeliveryPipelineView["roadmapGroups"][number];
export type RoadmapViewMode = "overall" | "business" | "technical";
const DEFAULT_ROADMAP_EDIT_PERMISSIONS: RoadmapEditPermissions = {
  userId: "",
  canManageMilestones: true,
  canManageWorkItems: true,
  canUpdateAssignedWorkItems: true,
  canManageCapabilities: true,
  canUpdateAssignedCapabilities: true,
};
type RoadmapStatusFilter =
  | "all"
  | "active"
  | "at-risk"
  | "blocked"
  | "completed"
  | "not-started";

const STATUS_FILTERS: Array<{
  value: RoadmapStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "at-risk", label: "At Risk" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Not Started" },
];

const VIEW_PRESENTATION: Record<
  RoadmapViewMode,
  {
    groupLabel: string;
    columnLabel: string;
    description: string;
    timelineAriaLabel: string;
  }
> = {
  overall: {
    groupLabel: "All Phases",
    columnLabel: "Project Phase",
    description:
      "All project phases shown together. Click a phase to view details.",
    timelineAriaLabel: "Scrollable project phase timeline",
  },
  business: {
    groupLabel: "Milestone Phases",
    columnLabel: "Milestone Phase",
    description:
      "Outcome and milestone phases. Click a phase to view its delivery items.",
    timelineAriaLabel: "Scrollable business milestone timeline",
  },
  technical: {
    groupLabel: "Delivery Phases",
    columnLabel: "Delivery Phase",
    description:
      "Execution phases coloured by their dominant workstream.",
    timelineAriaLabel: "Scrollable technical phase timeline",
  },
};

function shortDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function isCurrentMonth(monthIso: string, asOfDate: Date) {
  const month = new Date(monthIso);
  return (
    month.getUTCFullYear() === asOfDate.getUTCFullYear() &&
    month.getUTCMonth() === asOfDate.getUTCMonth()
  );
}

function isAtRisk(item: RoadmapItem) {
  return (
    item.status === "AT_RISK" ||
    item.status === "BLOCKED" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function isActive(item: RoadmapItem) {
  return (
    item.status === "IN_PROGRESS" ||
    item.status === "AT_RISK" ||
    item.status === "BLOCKED"
  );
}

function matchesStatusFilter(item: RoadmapItem, filter: RoadmapStatusFilter) {
  switch (filter) {
    case "all":
      return true;
    case "active":
      return isActive(item);
    case "at-risk":
      return isAtRisk(item);
    case "blocked":
      return item.status === "BLOCKED";
    case "completed":
      return item.status === "COMPLETED";
    case "not-started":
      return item.status === "NOT_STARTED";
  }
}

export function TimelineRoadmapPanel({
  pipeline,
  projectId,
  groups,
  viewMode,
  onViewModeChange,
  permissions = DEFAULT_ROADMAP_EDIT_PERMISSIONS,
  focusedGroupCode,
  onFocusedGroupHandled,
}: {
  pipeline: DeliveryPipelineView;
  projectId: string;
  groups: DeliveryPipelineView["roadmapGroups"];
  viewMode: RoadmapViewMode;
  onViewModeChange: (viewMode: RoadmapViewMode) => void;
  permissions?: RoadmapEditPermissions;
  focusedGroupCode?: string | null;
  onFocusedGroupHandled?: () => void;
}) {
  const [expandedGroupCodes, setExpandedGroupCodes] = useState<string[]>(
    groups[0]?.code ? [groups[0].code] : [],
  );
  const [timelineZoom, setTimelineZoom] = useState<6 | 12 | 18>(6);
  const [statusFilter, setStatusFilter] =
    useState<RoadmapStatusFilter>("all");
  const [showSpecificItems, setShowSpecificItems] = useState(true);
  const [showSharedItems, setShowSharedItems] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const groupMenuRef = useRef<HTMLDivElement | null>(null);
  const filtersMenuRef = useRef<HTMLDivElement | null>(null);
  const groupAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewPresentation = VIEW_PRESENTATION[viewMode];
  const currentViewLabel = viewPresentation.groupLabel;
  const workstreamLegend = useMemo(() => {
    const names = new Map<string, string>();
    for (const group of groups) {
      for (const item of group.items) {
        names.set(
          item.primaryWorkstream.code,
          item.primaryWorkstream.name,
        );
        for (const { workstream } of item.supportingWorkstreams) {
          names.set(workstream.code, workstream.name);
        }
      }
    }
    return [...names.entries()].sort((left, right) =>
      left[1].localeCompare(right[1]),
    );
  }, [groups]);

  const roadmapWidth = useMemo(() => {
    const monthWidth = timelineZoom === 6 ? 96 : timelineZoom === 12 ? 116 : 134;
    return Math.max(980, 280 + pipeline.timeline.months.length * monthWidth);
  }, [pipeline.timeline.months.length, timelineZoom]);

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        const items = group.items.filter((item) => {
          if (!matchesStatusFilter(item, statusFilter)) return false;
          if (!showSpecificItems && item.itemKind === "specific") return false;
          if (!showSharedItems && item.itemKind === "shared") return false;
          return true;
        });
        if (!items.length) return null;
        return { ...group, items } as RoadmapGroup;
      })
      .filter((group): group is RoadmapGroup => Boolean(group));
  }, [groups, statusFilter, showSharedItems, showSpecificItems]);

  const activeFilterCount =
    (statusFilter === "all" ? 0 : 1) +
    (showSpecificItems ? 0 : 1) +
    (showSharedItems ? 0 : 1);

  useEffect(() => {
    if (!focusedGroupCode) return;

    const target = groupAnchorRefs.current[focusedGroupCode];
    if (!target) {
      onFocusedGroupHandled?.();
      return;
    }

    setExpandedGroupCodes((current) =>
      current.includes(focusedGroupCode)
        ? current
        : [...current, focusedGroupCode],
    );

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      onFocusedGroupHandled?.();
    });
  }, [focusedGroupCode, onFocusedGroupHandled]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (groupMenuRef.current && !groupMenuRef.current.contains(target)) {
        setShowGroupMenu(false);
      }
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(target)) {
        setShowFilters(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowGroupMenu(false);
        setShowFilters(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleGroupExpansion(code: string) {
    setExpandedGroupCodes((current) => {
      if (current.includes(code)) {
        return current.filter((groupCode) => groupCode !== code);
      }
      return [...current, code];
    });
  }

  if (!groups.length) return null;

  return (
    <section
      className={cn(
        "orbit-panel overflow-hidden",
      )}
      aria-label="Timeline roadmap"
    >
      <div className="relative border-b border-[var(--orbit-border-soft)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[1.05rem] font-bold text-[var(--orbit-text)]">
              Timeline roadmap
            </h2>
            <p className="mt-1 text-[0.82rem] text-[var(--orbit-text-muted)]">
              {viewPresentation.description}
            </p>
            {viewMode === "technical" ? (
              <div
                className="mt-2 flex flex-wrap items-center gap-3 text-[0.66rem] font-semibold text-[var(--orbit-text-muted)]"
                aria-label="Project workstream colour legend"
              >
                {workstreamLegend.map(([code, name]) => {
                  const presentation = workstreamPresentation(code);
                  return (
                    <span key={code} className="inline-flex items-center gap-1.5">
                      <span
                        className={cn("size-2 rounded-full", presentation.dot)}
                        aria-hidden="true"
                      />
                      {name}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              ref={groupMenuRef}
              className="relative inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--orbit-border)] bg-white px-3.5 text-[0.72rem] font-semibold text-[var(--orbit-text-muted)] shadow-[0_6px_18px_rgba(16,24,40,0.06)]"
            >
              <span>Group by:</span>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={showGroupMenu}
                aria-label={`Group roadmap by, current option ${currentViewLabel}`}
                onClick={() => {
                  setShowGroupMenu((current) => !current);
                  setShowFilters(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f8fc] px-2.5 py-1 text-[0.72rem] font-bold text-[var(--orbit-text)] transition hover:bg-[#eef1f8]"
              >
                {currentViewLabel}
                <ChevronDown
                  className={cn(
                    "size-3.5 text-[var(--orbit-text-subtle)] transition-transform",
                    showGroupMenu && "rotate-180",
                  )}
                />
              </button>

              {showGroupMenu ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[240px] overflow-hidden rounded-2xl border border-[var(--orbit-border)] bg-white p-1.5 shadow-[0_18px_50px_rgba(16,24,40,0.16)]">
                  <div className="px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
                    Select phase group
                  </div>
                  <div className="space-y-1">
                    {(Object.keys(VIEW_PRESENTATION) as RoadmapViewMode[]).map(
                      (mode) => {
                        const isSelected = mode === viewMode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              onViewModeChange(mode);
                              setShowGroupMenu(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[0.76rem] font-semibold transition",
                              isSelected
                                ? "bg-[#efebff] text-[#6350c9]"
                                : "text-[var(--orbit-text-muted)] hover:bg-[#f7f8fc] hover:text-[var(--orbit-text)]",
                            )}
                          >
                            <span>{VIEW_PRESENTATION[mode].groupLabel}</span>
                            {isSelected ? (
                              <span className="rounded-full bg-[#6350c9] px-2 py-0.5 text-[0.58rem] font-black text-white">
                                Active
                              </span>
                            ) : null}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFilters((current) => !current);
                  setShowGroupMenu(false);
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[0.72rem] font-semibold shadow-xs transition",
                  showFilters
                    ? "border-[var(--orbit-purple)] bg-[#efebff] text-[#6350c9]"
                    : "border-[var(--orbit-border)] bg-white text-[var(--orbit-text-muted)] hover:text-[var(--orbit-text)]",
                )}
                aria-expanded={showFilters}
                aria-haspopup="menu"
              >
                <Filter className="size-3.5" />
                Filters
                {activeFilterCount ? (
                  <span className="rounded-full bg-[#6350c9] px-1.5 py-0.5 text-[0.58rem] font-black text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {showFilters ? (
                <div
                  ref={filtersMenuRef}
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-2xl border border-[var(--orbit-border)] bg-white p-3 shadow-[0_18px_50px_rgba(16,24,40,0.15)]"
                >
                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 text-[0.64rem] font-black uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
                        Status
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {STATUS_FILTERS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatusFilter(option.value)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-left text-[0.67rem] font-semibold transition",
                              statusFilter === option.value
                                ? "border-[#6350c9] bg-[#efebff] text-[#6350c9]"
                                : "border-[var(--orbit-border)] bg-white text-[var(--orbit-text-muted)] hover:text-[var(--orbit-text)]",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-[0.64rem] font-black uppercase tracking-[0.08em] text-[var(--orbit-text-subtle)]">
                        Item kind
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowSpecificItems((current) => !current)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-[0.67rem] font-semibold transition",
                            showSpecificItems
                              ? "border-[#0e9f8e]/30 bg-[#e3f8f4] text-[#0a6b56]"
                              : "border-[var(--orbit-border)] bg-white text-[var(--orbit-text-muted)]",
                          )}
                        >
                          Specific
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSharedItems((current) => !current)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-[0.67rem] font-semibold transition",
                            showSharedItems
                              ? "border-[#6e5ae6]/30 bg-[#efebff] text-[#6350c9]"
                              : "border-[var(--orbit-border)] bg-white text-[var(--orbit-text-muted)]",
                          )}
                        >
                          Shared
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[var(--orbit-border-soft)] pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowSpecificItems(true);
                          setShowSharedItems(true);
                        }}
                        className="text-[0.67rem] font-semibold text-[var(--orbit-text-muted)] hover:text-[var(--orbit-text)]"
                      >
                        Reset filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFilters(false)}
                        className="rounded-lg bg-[#121827] px-2.5 py-1.5 text-[0.67rem] font-semibold text-white"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="inline-flex h-10 items-center rounded-xl border border-[var(--orbit-border)] bg-white p-1 shadow-xs">
              {([6, 12, 18] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimelineZoom(value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[0.72rem] font-semibold transition",
                    timelineZoom === value
                      ? "bg-[#121827] text-white"
                      : "text-[var(--orbit-text-muted)] hover:text-[var(--orbit-text)]",
                  )}
                >
                  {value}M
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      <div
        className="overflow-x-auto"
        tabIndex={0}
        aria-label={viewPresentation.timelineAriaLabel}
      >
        <div style={{ minWidth: `${roadmapWidth}px` }}>
          <div className="grid grid-cols-[280px_1fr] border-b border-[var(--orbit-border-soft)]">
            <div className="sticky left-0 z-30 flex h-12 items-center border-r border-[var(--orbit-border-soft)] bg-white px-4 text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[var(--orbit-text-subtle)]">
              {viewPresentation.columnLabel}
            </div>
            <div
              className="grid bg-white"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, pipeline.timeline.months.length)}, minmax(0, 1fr))`,
              }}
            >
              {pipeline.timeline.months.map((month) => {
                const currentMonth = isCurrentMonth(month.iso, pipeline.asOfDate);
                return (
                  <div
                    key={month.iso}
                    className={cn(
                      "relative flex h-12 items-center justify-center border-r border-[var(--orbit-border-soft)] text-[0.72rem] font-bold text-[var(--orbit-text-subtle)] last:border-r-0",
                      currentMonth && "bg-[#fdf1dd]/55",
                    )}
                  >
                    {month.label.toUpperCase()}
                    {currentMonth ? (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-px left-1/2 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#e8890c]"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupCodes.includes(group.code);
            const groupPresentation = pipelineStagePresentation[group.stage];
            const groupWorkstreamPresentation = workstreamPresentation(
              group.dominantWorkstream,
            );
            const riskCount = group.items.filter(isAtRisk).length;
            const milestoneCount = group.items.length;

            return (
              <div
                key={group.code}
                ref={(element) => {
                  groupAnchorRefs.current[group.code] = element;
                }}
                id={`roadmap-group-${group.code}`}
                className="scroll-mt-6 border-b border-[var(--orbit-border-soft)] last:border-b-0"
              >
                <div className="grid grid-cols-[280px_1fr] bg-white">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`desktop-roadmap-group-${group.code}`}
                    className="sticky left-0 z-20 flex min-h-[56px] items-center gap-2 border-r border-[var(--orbit-border-soft)] bg-white px-4 py-2 text-left outline-none transition hover:bg-[#fafbfe] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--orbit-purple)]"
                    onClick={() => toggleGroupExpansion(group.code)}
                    title={group.name}
                  >
                    <ChevronDown
                      className={cn(
                        "size-3 shrink-0 text-[var(--orbit-text-subtle)] transition-transform",
                        !isExpanded && "-rotate-90",
                      )}
                    />
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        viewMode === "technical"
                          ? groupWorkstreamPresentation.dot
                          : groupPresentation.dot,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <div className="truncate text-[0.86rem] font-bold text-[var(--orbit-text)]">
                          {group.name}
                        </div>
                        <div className="shrink-0 text-[0.66rem] text-[var(--orbit-text-subtle)]">
                          {milestoneCount} {milestoneCount === 1 ? "milestone" : "milestones"}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="relative min-h-[56px] bg-white px-4 py-2">
                    <GroupRoadmapSummary
                      group={group}
                      pipeline={pipeline}
                      colorByWorkstream={viewMode === "technical"}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-4 z-30 flex items-center">
                      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-[var(--orbit-border)] bg-white/95 px-2.5 py-1 text-[0.66rem] font-bold text-[var(--orbit-text)] shadow-xs backdrop-blur-xs">
                        <span>{group.progress}%</span>
                        <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                        <span>{group.specificCount} specific</span>
                        <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                        <span>{group.sharedCount} shared</span>
                        {group.dueDate ? (
                          <>
                            <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                            <span>Due {shortDate(group.dueDate)}</span>
                          </>
                        ) : null}
                        {riskCount ? (
                          <>
                            <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                            <span className="text-[#c8362b]">{riskCount} at risk</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-[var(--orbit-border-soft)] bg-[#fafbfc]">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      {permissions.canManageWorkItems ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 border-[#d8d3ff] bg-[#efebff]/60 px-2.5 text-[0.66rem] font-bold text-[#6350c9] hover:bg-[#efebff]"
                        >
                          <Link href={`/projects/${projectId}/milestones/${group.id}/work-items/new`}>
                            <Plus className="size-3" />
                            Add Sub-Milestone
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled
                          title="You do not have permission to add work items"
                          className="h-7 cursor-not-allowed gap-1.5 px-2.5 text-[0.66rem] font-bold opacity-50"
                        >
                          <Plus className="size-3" />
                          Add Sub-Milestone
                        </Button>
                      )}
                      {permissions.canManageMilestones ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-[0.66rem] font-semibold text-[var(--orbit-text-muted)]"
                        >
                          <Link href={`/projects/${projectId}/milestones/${group.id}/edit`}>
                            <Pencil className="size-3" />
                            Edit phase
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          title="You do not have permission to edit phases"
                          className="h-7 cursor-not-allowed gap-1.5 px-2 text-[0.66rem] font-semibold opacity-50"
                        >
                          <Pencil className="size-3" />
                          Edit phase
                        </Button>
                      )}
                      <span className="ml-auto text-[0.66rem] text-[var(--orbit-text-subtle)]">
                        {group.specificCount} specific · {group.sharedCount} shared
                      </span>
                    </div>

                    <div id={`desktop-roadmap-group-${group.code}`}>
                      {group.items.map((item) => (
                        <div
                          key={`${item.itemKind}-${item.id}`}
                          className="grid grid-cols-[280px_1fr] border-t border-[var(--orbit-border-soft)] bg-white"
                        >
                          <div className="sticky left-0 z-10 min-h-[70px] border-r border-[var(--orbit-border-soft)] bg-white px-4 py-2">
                            <RoadmapItemEditor
                              item={item}
                              pipeline={pipeline}
                              milestoneId={group.id}
                              projectId={projectId}
                              canEdit={canEditRoadmapItem(item, permissions)}
                            />
                          </div>
                          <div className="relative min-h-[70px] px-4 py-2">
                            <TimelineLane
                              item={item}
                              pipeline={pipeline}
                              colorByWorkstream={viewMode === "technical"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
