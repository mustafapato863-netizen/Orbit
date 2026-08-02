"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  archiveCapabilityAction,
  archiveWorkItemAction,
  updateCapabilityAction,
  updateWorkItemAction,
} from "@/app/(workspace)/projects/execution-actions";
import {
  pipelineStagePresentation,
  progressBarClassForStatus,
} from "@/components/pipeline/pipeline-presentation";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { workItemStatuses } from "@/lib/execution/execution.schemas";
import {
  OVERVIEW_STAGES,
  buildOverviewJourney,
  type DeliveryPipelineView,
} from "@/lib/pipeline/pipeline";
import { cn } from "@/lib/utils";
import {
  TimelineRoadmapPanel,
  type RoadmapViewMode,
} from "@/components/pipeline/timeline-roadmap-panel";
import type { RoadmapEditPermissions } from "@/components/pipeline/roadmap-row";

type PipelineRoadmapItem =
  DeliveryPipelineView["roadmapGroups"][number]["items"][number];

function shortDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function fullDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function monthRangeLabel(pipeline: DeliveryPipelineView) {
  const first = pipeline.timeline.months[0]?.label;
  const last = pipeline.timeline.months.at(-1)?.label;
  if (!first || !last) return "Timeline not set";
  return `${first} – ${last}`;
}

function timelinePercent(value: Date, start: Date, end: Date) {
  const duration = Math.max(1, end.getTime() - start.getTime());
  return Math.max(
    0,
    Math.min(100, ((value.getTime() - start.getTime()) / duration) * 100),
  );
}

function isCurrentMonth(monthIso: string, asOfDate: Date) {
  const month = new Date(monthIso);
  return (
    month.getUTCFullYear() === asOfDate.getUTCFullYear() &&
    month.getUTCMonth() === asOfDate.getUTCMonth()
  );
}

function itemAtRisk(item: PipelineRoadmapItem) {
  return (
    item.status === "AT_RISK" ||
    item.status === "BLOCKED" ||
    item.riskLevel === "HIGH" ||
    item.riskLevel === "CRITICAL"
  );
}

function statusTone(status: string): Status {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
      return "in-progress";
    case "AT_RISK":
      return "at-risk";
    case "BLOCKED":
      return "blocked";
    default:
      return "not-started";
  }
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function progressForStatus(status: string, progress: number) {
  switch (status) {
    case "COMPLETED":
      return 100;
    case "NOT_STARTED":
    case "CANCELLED":
      return 0;
    default:
      return progress;
  }
}

function dateInputValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function capabilityMilestoneLinks(
  pipeline: DeliveryPipelineView,
  sharedCapabilityId: string,
) {
  return pipeline.milestones.flatMap((milestone) =>
    milestone.sharedCapabilityLinks
      .filter(
        ({ sharedCapability }) => sharedCapability.id === sharedCapabilityId,
      )
      .map(({ sourceReference, dependencyNotes, isCritical }) => ({
        milestoneId: milestone.id,
        sourceReference: sourceReference ?? "",
        dependencyNotes: dependencyNotes ?? "",
        isCritical,
      })),
  );
}

export function TimelineLane({
  item,
  pipeline,
  compact = false,
}: {
  item: PipelineRoadmapItem;
  pipeline: DeliveryPipelineView;
  compact?: boolean;
}) {
  const { start, end, months } = pipeline.timeline;
  const today = timelinePercent(pipeline.asOfDate, start, end);
  const journey = buildOverviewJourney(item);
  const presentation = pipelineStagePresentation[journey.currentStage];
  const markers = journey.markers.filter(
    (marker) => marker.date >= start && marker.date <= end,
  );
  const itemStart = item.startDate
    ? timelinePercent(item.startDate, start, end)
    : null;
  const itemEnd = item.dueDate
    ? timelinePercent(item.dueDate, start, end)
    : null;

  return (
    <div
      role="img"
      className={cn(
        "relative overflow-visible",
        compact ? "h-[48px]" : "h-[72px]",
      )}
      aria-label={`${item.name}: ${presentation.displayLabel}; ${markers.map((marker) => `${marker.code} ${fullDate(marker.date)}`).join(", ") || "no checkpoints scheduled"}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, months.length)}, minmax(0, 1fr))`,
        }}
      >
        {months.map((month) => {
          const current = isCurrentMonth(month.iso, pipeline.asOfDate);
          return (
            <span
              key={month.iso}
              className={cn(
                "border-r border-[var(--orbit-border-soft)] last:border-r-0 transition-colors",
                current && "bg-[#e8890c]/[0.03]",
              )}
            />
          );
        })}
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-y-0 z-10 w-0.5 bg-[#e8890c]/70 border-r border-[#e8890c]/40"
        style={{ left: `${today}%` }}
      />

      {itemStart !== null && itemEnd !== null ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute z-20 rounded-full shadow-xs ring-1 ring-black/5",
            compact ? "top-[22px] h-1.5" : "top-[31px] h-2",
            presentation.bar,
          )}
          style={{
            left: `${itemStart}%`,
            width: `${Math.max(1.3, itemEnd - itemStart)}%`,
          }}
        />
      ) : null}

      {!compact
        ? markers.map((marker, index) => {
            const left = timelinePercent(marker.date, start, end);
            const markerPresentation =
              pipelineStagePresentation[marker.stage];
            return (
              <span
                key={`${marker.code}-${marker.date.toISOString()}-${index}`}
                className="absolute inset-y-0 z-30 w-0"
                style={{ left: `${left}%` }}
                title={`${marker.code} · ${fullDate(marker.date)} · ${marker.actual ? "Actual" : "Planned"}`}
              >
                <span
                  className={cn(
                    "absolute top-[17px] -translate-x-1/2 rounded-full px-2 py-0.5 text-[0.52rem] font-black leading-3 tracking-wide shadow-md ring-2 ring-white/90 border border-white/40 transition-transform hover:scale-110 cursor-pointer",
                    markerPresentation.bar,
                    markerPresentation.contrastText,
                  )}
                >
                  {marker.code}
                </span>
                <span className="absolute top-[43px] -translate-x-1/2 whitespace-nowrap text-[0.55rem] font-bold text-[var(--orbit-text-muted)] bg-white/80 px-1 rounded backdrop-blur-xs">
                  {shortDate(marker.date)}
                </span>
              </span>
            );
          })
        : null}
    </div>
  );
}

export function RoadmapItemEditor({
  item,
  pipeline,
  milestoneId,
  projectId,
}: {
  item: PipelineRoadmapItem;
  pipeline: DeliveryPipelineView;
  milestoneId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.name);
  const [draftStatus, setDraftStatus] = useState<string>(item.status);
  const [draftProgress, setDraftProgress] = useState(
    String(progressForStatus(item.status, item.progress)),
  );
  const [draftStartDate, setDraftStartDate] = useState(dateInputValue(item.startDate));
  const [draftDueDate, setDraftDueDate] = useState(dateInputValue(item.dueDate));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const progress =
    draftStatus === "IN_PROGRESS"
      ? Number(draftProgress || progressForStatus(item.status, item.progress))
      : progressForStatus(draftStatus, item.progress);
  const baseTitle =
    item.itemKind === "shared" ? `Shared: ${item.name}` : item.name;

  async function handleSave() {
    const payload = {
      projectId,
      code: item.code,
      name: draftName.trim(),
      description: item.description ?? "",
      primaryWorkstreamId: item.primaryWorkstream.id,
      supportingWorkstreamIds: item.supportingWorkstreams.map(
        ({ workstream }) => workstream.id,
      ),
      status: draftStatus as (typeof workItemStatuses)[number],
      progress,
      deliveryStage: item.deliveryStage,
      nextGate: item.nextGate ?? "",
      startDate: draftStartDate,
      dueDate: draftDueDate,
      ownerId: item.owner?.id ?? "",
      riskLevel: item.riskLevel,
      blocker: item.blocker ?? "",
      notes: item.notes ?? "",
      acceptanceCriteria: item.acceptanceCriteria ?? "",
    };

    startTransition(async () => {
      const result =
        item.itemKind === "specific"
          ? await updateWorkItemAction({
              ...payload,
              milestoneId,
              workItemId: item.id,
            })
          : await updateCapabilityAction({
              ...payload,
              sharedCapabilityId: item.id,
              milestoneLinks: capabilityMilestoneLinks(pipeline, item.id),
            });

      if (!result.success) {
        const errorDetail = result.fieldErrors
          ? Object.entries(result.fieldErrors)
              .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : String(errs)}`)
              .join(" | ")
          : null;
        setMessage(errorDetail || result.message || "The item could not be updated.");
        return;
      }

      setIsEditing(false);
      setMessage(null);
      router.refresh();
    });
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    startTransition(async () => {
      const result =
        item.itemKind === "specific"
          ? await archiveWorkItemAction({
              projectId,
              milestoneId,
              workItemId: item.id,
            })
          : await archiveCapabilityAction({
              projectId,
              sharedCapabilityId: item.id,
            });

      setIsDeleting(false);
      setShowDeleteModal(false);

      if (!result.success) {
        setMessage(result.message || "The item could not be deleted.");
        return;
      }

      setIsEditing(false);
      setMessage(null);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <>
        <form
          className="space-y-2 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Task Name</label>
            <input
              autoFocus
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.72rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              aria-label="Work package name"
            />
          </div>
          <div>
            <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Status</label>
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
              className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.68rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              aria-label="Work package status"
            >
              {workItemStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {draftStatus === "IN_PROGRESS" ? (
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">
                Progress (%)
              </label>
              <input
                type="number"
                inputMode="numeric"
                step={1}
                value={draftProgress}
                onChange={(event) => setDraftProgress(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-2 text-[0.72rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
                aria-label="Work package progress"
              />
              <p className="mt-1 text-[0.56rem] text-[var(--orbit-text-muted)]">
                Enter a whole percentage above 10.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Start Date</label>
              <input
                type="date"
                value={draftStartDate}
                onChange={(event) => setDraftStartDate(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-1.5 text-[0.65rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              />
            </div>
            <div>
              <label className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">Due Date</label>
              <input
                type="date"
                value={draftDueDate}
                onChange={(event) => setDraftDueDate(event.target.value)}
                className="h-7 w-full rounded-md border border-[var(--orbit-border)] bg-white px-1.5 text-[0.65rem] font-semibold text-[var(--orbit-text)] outline-none focus:border-[var(--orbit-purple)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                className="h-7 bg-[var(--orbit-purple)] hover:bg-[#5b48c5] text-white px-3 text-[0.65rem]"
                disabled={isPending || !draftName.trim()}
              >
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[0.65rem]"
                disabled={isPending}
                onClick={() => {
                  setIsEditing(false);
                  setDraftName(item.name);
                  setDraftStatus(item.status);
                  setDraftProgress(String(progressForStatus(item.status, item.progress)));
                  setDraftStartDate(dateInputValue(item.startDate));
                  setDraftDueDate(dateInputValue(item.dueDate));
                  setMessage(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-[0.65rem] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isPending}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
          {message ? (
            <p role="alert" className="text-[0.65rem] font-semibold text-destructive mt-1">
              {message}
            </p>
          ) : null}
        </form>

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          itemName={item.name}
          isDeleting={isDeleting}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setShowDeleteModal(false)}
        />
      </>
    );
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="block w-full text-left text-[0.73rem] font-semibold leading-4 text-[var(--orbit-text)] outline-none transition hover:text-[#6350c9] hover:underline focus-visible:underline"
        onClick={() => {
          setIsEditing(true);
          setMessage(null);
        }}
        title={`Edit ${baseTitle}`}
      >
        <span className="line-clamp-2">{baseTitle}</span>
      </button>
      <div className="mt-2 flex items-center gap-2">
        <StatusBadge
          status={statusTone(item.status)}
          label={statusLabel(item.status)}
          className="px-1.5 py-0.5 text-[0.54rem]"
        />
        <span className="text-[0.58rem] font-semibold text-[var(--orbit-text-muted)]">
          {progress}%
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eef0f4]">
        <div
          className={cn(
            "h-full rounded-full",
            progressBarClassForStatus(item.status),
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function FeatureRow({
  item,
  milestoneId,
  projectId,
  pipeline,
}: {
  item: PipelineRoadmapItem;
  milestoneId: string;
  projectId: string;
  pipeline: DeliveryPipelineView;
}) {
  const journey = buildOverviewJourney(item);
  const presentation = pipelineStagePresentation[journey.currentStage];

  return (
    <div className="grid grid-cols-[260px_1fr] border-b border-[var(--orbit-border-soft)] bg-white hover:bg-[#fafbfe] transition-colors last:border-b-0 group">
      <div className="sticky left-0 z-20 flex min-h-[72px] items-start gap-2 border-r border-[var(--orbit-border-soft)] bg-white group-hover:bg-[#fafbfe] transition-colors px-3 py-2.5">
        {itemAtRisk(item) ? (
          <TriangleAlert
            className="mt-0.5 size-3.5 shrink-0 fill-[#e4483c] text-[#e4483c]"
            aria-label="At risk"
          />
        ) : null}
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[0.52rem] font-extrabold",
            presentation.soft,
            presentation.text,
          )}
        >
          {presentation.shortCode}
        </span>
        <div className="min-w-0 flex-1">
          <RoadmapItemEditor
            item={item}
            pipeline={pipeline}
            milestoneId={milestoneId}
            projectId={projectId}
          />
        </div>
      </div>
      <TimelineLane item={item} pipeline={pipeline} />
    </div>
  );
}

function MobileFeatureCard({
  item,
  milestoneId,
  projectId,
  pipeline,
}: {
  item: PipelineRoadmapItem;
  milestoneId: string;
  projectId: string;
  pipeline: DeliveryPipelineView;
}) {
  const journey = buildOverviewJourney(item);
  const presentation = pipelineStagePresentation[journey.currentStage];
  const currentIndex = OVERVIEW_STAGES.indexOf(journey.currentStage);
  const markerByStage = new Map(
    journey.markers.map((marker) => [marker.stage, marker]),
  );

  return (
    <article className="orbit-panel p-3.5">
      <div className="mb-2 flex items-center gap-2 text-[0.65rem] text-[var(--orbit-text-muted)]">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[0.55rem] font-extrabold",
            presentation.soft,
            presentation.text,
          )}
        >
          {presentation.shortCode}
        </span>
        <span>{item.primaryWorkstream.name}</span>
        {item.dueDate ? (
          <span className="ml-auto inline-flex items-center gap-1">
            <CalendarDays className="size-3" />
            {shortDate(item.dueDate)}
          </span>
        ) : null}
      </div>

      <RoadmapItemEditor
        item={item}
        pipeline={pipeline}
        milestoneId={milestoneId}
        projectId={projectId}
      />

      <ol className="mt-3 space-y-1.5" aria-label="Delivery stage journey">
        {OVERVIEW_STAGES.map((stage, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;
          const marker = markerByStage.get(stage);
          return (
            <li key={stage} className="relative flex min-h-6 items-center gap-2">
              {index ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-2 left-[6px] h-3 w-0.5",
                    index <= currentIndex
                      ? "bg-[#6e5ae6]"
                      : "bg-[var(--orbit-border)]",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex size-3 shrink-0 items-center justify-center rounded-full border-2 bg-white",
                  complete && "border-[#6e5ae6] bg-[#6e5ae6] text-white",
                  current && "border-[#6e5ae6] ring-3 ring-[#6e5ae6]/15",
                  !complete && !current && "border-[#d4d8e1]",
                )}
              >
                {complete ? <CircleCheck className="size-2" /> : null}
              </span>
              <span className="text-[0.64rem] font-semibold text-[var(--orbit-text-muted)]">
                {pipelineStagePresentation[stage].displayLabel}
              </span>
              <span className="ml-auto text-[0.58rem] text-[var(--orbit-text-subtle)]">
                {marker ? shortDate(marker.date) : "—"}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function DeliveryPipelineBoard({
  pipeline,
  projectId,
  permissions,
}: {
  pipeline: DeliveryPipelineView;
  projectId: string;
  permissions?: RoadmapEditPermissions;
}) {
  const visibleGroups = pipeline.roadmapGroups.filter(
    (group) => group.items.length > 0,
  );
  const [viewMode, setViewMode] = useState<RoadmapViewMode>(
    visibleGroups.some((group) => group.code.startsWith("BPH-"))
      ? "business"
      : "overall",
  );
  const filteredGroups = useMemo(() => {
    if (viewMode === "business") {
      return visibleGroups.filter((g) => g.code.startsWith("BPH-"));
    }
    if (viewMode === "technical") {
      return visibleGroups.filter((g) => g.code.startsWith("PH-"));
    }
    return visibleGroups;
  }, [visibleGroups, viewMode]);

  const [allowMultipleExpanded, setAllowMultipleExpanded] = useState(true);
  const [expandedGroupCodes, setExpandedGroupCodes] = useState<string[]>(
    visibleGroups[0]?.code ? [visibleGroups[0].code] : [],
  );

  function toggleGroupExpansion(code: string) {
    setExpandedGroupCodes((current) => {
      if (current.includes(code)) {
        return current.filter((groupCode) => groupCode !== code);
      }
      return allowMultipleExpanded ? [...current, code] : [code];
    });
  }

  function toggleMultipleMode() {
    setAllowMultipleExpanded((current) => {
      if (current && expandedGroupCodes.length > 1) {
        setExpandedGroupCodes((groups) => groups.slice(0, 1));
      }
      return !current;
    });
  }

  const roadmapWidth = useMemo(
    () => Math.max(900, 260 + pipeline.timeline.months.length * 145),
    [pipeline.timeline.months.length],
  );

  return (
    <>
      <TimelineRoadmapPanel
        pipeline={pipeline}
        projectId={projectId}
        groups={filteredGroups}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        permissions={permissions}
      />

      <section className="hidden orbit-panel overflow-hidden" aria-label="Business milestone roadmap">
      <div className="orbit-panel-head">
        <div>
          <h2 className="orbit-panel-title">Timeline roadmap</h2>
          <p className="orbit-panel-subtitle">
            Delivery phases and their work packages. Click a work package name to edit it.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-lg border border-[var(--orbit-border)] bg-white px-3 py-2 text-[0.68rem] font-semibold text-[var(--orbit-text-muted)]">
            {monthRangeLabel(pipeline)}
          </span>
          <button
            type="button"
            aria-pressed={allowMultipleExpanded}
            onClick={toggleMultipleMode}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[0.68rem] font-semibold transition",
              allowMultipleExpanded
                ? "border-[#d8d3ff] bg-[#efebff] text-[#6350c9]"
                : "border-[var(--orbit-border)] bg-white text-[var(--orbit-text-muted)]",
            )}
          >
            {allowMultipleExpanded ? <Check className="size-3.5" /> : null}
            Multiple open
          </button>
        </div>
      </div>

      <div className="flex flex-nowrap items-center gap-x-4 overflow-x-auto border-b border-[var(--orbit-border-soft)] px-[18px] py-3 md:flex-wrap">
        {OVERVIEW_STAGES.map((stage) => {
          const presentation = pipelineStagePresentation[stage];
          return (
            <div
              key={stage}
              className="flex shrink-0 items-center gap-1.5 text-[0.67rem] text-[var(--orbit-text-muted)]"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  presentation.dot,
                )}
              />
              <strong>{presentation.shortCode}</strong>
              {presentation.displayLabel}
            </div>
          );
        })}
      </div>

      <div
        className="hidden overflow-x-auto md:block"
        tabIndex={0}
        aria-label="Scrollable business phase timeline"
      >
        <div style={{ minWidth: `${roadmapWidth}px` }}>
          <div className="grid grid-cols-[260px_1fr] border-b border-[var(--orbit-border-soft)]">
            <div className="sticky left-0 z-30 flex h-10 items-center border-r border-[var(--orbit-border-soft)] bg-white px-3 text-[0.62rem] font-bold uppercase tracking-[0.05em] text-[var(--orbit-text-subtle)]">
              Phase / work package
            </div>
            <div
              className="grid bg-white"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, pipeline.timeline.months.length)}, minmax(0, 1fr))`,
              }}
            >
              {pipeline.timeline.months.map((month) => {
                const currentMonth = isCurrentMonth(
                  month.iso,
                  pipeline.asOfDate,
                );
                return (
                  <div
                    key={month.iso}
                    className={cn(
                      "relative flex h-10 items-center justify-center border-r border-[var(--orbit-border-soft)] text-[0.65rem] font-semibold text-[var(--orbit-text-muted)] last:border-r-0",
                      currentMonth && "bg-[#fdf1dd]/55",
                    )}
                  >
                    {month.label}
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
            const riskCount = group.items.filter(itemAtRisk).length;
            const groupPresentation = pipelineStagePresentation[group.stage];
            const summaryItem = group.items[0];
            return (
              <div
                key={group.code}
                className="border-b border-[var(--orbit-border-soft)] last:border-b-0"
              >
                <div className="grid grid-cols-[260px_1fr] bg-[var(--orbit-surface-muted)]">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`desktop-roadmap-group-${group.code}`}
                    className="sticky left-0 z-20 flex min-h-[48px] items-center gap-2 border-r border-[var(--orbit-border-soft)] bg-[var(--orbit-surface-muted)] px-3 text-left outline-none transition hover:bg-[#f6f3ff] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--orbit-purple)]"
                    onClick={() => toggleGroupExpansion(group.code)}
                    title={group.nextAction ?? undefined}
                  >
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-[var(--orbit-text-subtle)] transition-transform",
                        !isExpanded && "-rotate-90",
                      )}
                    />
                    <span className="rounded-md bg-[#efebff] px-1.5 py-0.5 text-[0.57rem] font-extrabold text-[#6350c9]">
                      {group.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.72rem] font-bold text-[var(--orbit-text)]">
                      {group.name}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[0.52rem] font-extrabold",
                        groupPresentation.soft,
                        groupPresentation.text,
                      )}
                    >
                      {groupPresentation.shortCode}
                    </span>
                  </button>

                  <div className="relative min-h-[48px]">
                    {summaryItem ? (
                      <TimelineLane
                        item={summaryItem}
                        pipeline={pipeline}
                        compact
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-y-0 right-3 z-30 flex items-center">
                      <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-[var(--orbit-border)] bg-white/95 px-2.5 py-1 text-[0.65rem] font-bold text-[var(--orbit-text)] shadow-xs backdrop-blur-xs">
                        <span>{group.progress}%</span>
                        <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                        <span>{group.specificCount} items</span>
                        {group.dueDate ? (
                          <>
                            <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                            <span>Due {shortDate(group.dueDate)}</span>
                          </>
                        ) : null}
                        {riskCount ? (
                          <>
                            <span className="h-3 w-px bg-[var(--orbit-border-soft)]" aria-hidden="true" />
                            <span className="text-[#c8362b]">
                              {riskCount} at risk
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="flex items-center gap-2 border-b border-[var(--orbit-border-soft)] bg-white px-3 py-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2.5 text-[0.64rem] font-bold text-[#6350c9] border-[#6350c9]/30 bg-[#efebff]/60 hover:bg-[#efebff]"
                    >
                      <Link
                        href={`/projects/${projectId}/milestones/${group.id}/work-items/new`}
                      >
                        <Plus className="size-3" />
                        Add Sub-Milestone
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-[0.64rem] font-semibold text-[var(--orbit-text-muted)]"
                    >
                      <Link
                        href={`/projects/${projectId}/milestones/${group.id}/edit`}
                      >
                        <Pencil className="size-3" />
                        Edit phase
                      </Link>
                    </Button>
                    <span className="ml-auto text-[0.62rem] text-[var(--orbit-text-subtle)]">
                      {group.specificCount} specific · {group.sharedCount} shared
                    </span>
                  </div>
                ) : null}

                <div id={`desktop-roadmap-group-${group.code}`}>
                  {isExpanded
                    ? group.items.map((item) => (
                        <FeatureRow
                          key={`${item.itemKind}-${item.id}`}
                          item={item}
                          milestoneId={group.id}
                          projectId={projectId}
                          pipeline={pipeline}
                        />
                      ))
                    : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 bg-[var(--orbit-bg)] p-3 md:hidden">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroupCodes.includes(group.code);
          const riskCount = group.items.filter(itemAtRisk).length;
          const groupPresentation = pipelineStagePresentation[group.stage];
          return (
            <section
              key={group.code}
              className="orbit-panel overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`mobile-roadmap-group-${group.code}`}
                className="flex min-h-12 w-full items-start gap-2.5 bg-[var(--orbit-surface-muted)] px-3 py-2.5 text-left"
                onClick={() => toggleGroupExpansion(group.code)}
              >
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0 text-[var(--orbit-text-subtle)] transition-transform",
                    !isExpanded && "-rotate-90",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.69rem] font-extrabold text-[#6350c9]">
                    {group.code}
                  </span>
                  <strong className="mt-0.5 block text-[0.75rem] leading-4 text-[var(--orbit-text)]">
                    {group.name}
                  </strong>
                  <span className="mt-1 block text-[0.6rem] text-[var(--orbit-text-subtle)]">
                    {group.progress}% · {group.specificCount} items
                    {group.dueDate ? ` · Due ${shortDate(group.dueDate)}` : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[0.52rem] font-extrabold",
                    groupPresentation.soft,
                    groupPresentation.text,
                  )}
                >
                  {groupPresentation.shortCode}
                </span>
                {riskCount ? (
                  <span className="text-[0.58rem] font-bold text-[#c8362b]">
                    {riskCount} risk
                  </span>
                ) : null}
              </button>

              {isExpanded ? (
                <div className="flex items-center border-t border-[var(--orbit-border-soft)] bg-white px-3 py-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-[0.64rem]"
                  >
                    <Link
                      href={`/projects/${projectId}/milestones/${group.id}/edit`}
                    >
                      <Pencil className="size-3" />
                      Edit phase
                    </Link>
                  </Button>
                </div>
              ) : null}

              <div
                id={`mobile-roadmap-group-${group.code}`}
                className={cn(
                  "space-y-2.5 bg-[var(--orbit-bg)]",
                  isExpanded && "p-2.5",
                )}
              >
                {isExpanded
                  ? group.items.map((item) => (
                      <MobileFeatureCard
                        key={`${item.itemKind}-${item.id}`}
                        item={item}
                        milestoneId={group.id}
                        projectId={projectId}
                        pipeline={pipeline}
                      />
                    ))
                  : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
    </>
  );
}
